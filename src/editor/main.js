import { Scene, WebGLRenderer, PerspectiveCamera, DirectionalLight, AmbientLight, 
    GridHelper, AxesHelper, Box3, Vector3, Color } from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import Stats from 'three/examples/jsm/libs/stats.module.js';
import { Studio } from './Studio';
import { StudioUI } from './StudioUI';
import { Box, Sphere, Plane, MeshStandardMaterial, Mesh } from 'three';
import { RigidBody } from '../core/components/RigidBody';

class Editor {
    constructor() {
        this.scene = new Scene();
        this.camera = null;
        this.renderer = null;
        this.controls = null;
        this.stats = null;
        this.objects = new Map();
        this.selectedObject = null;

        this.init();
        this.setupScene();
        this.setupHelpers();
        this.setupEvents();
        this.animate();
    }

    init() {
        // Renderer
        this.renderer = new WebGLRenderer({
            canvas: document.getElementById('renderCanvas'),
            antialias: true
        });
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.shadowMap.enabled = true;

        // Camera
        this.camera = new PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.camera.position.set(5, 5, 5);
        this.camera.lookAt(0, 0, 0);

        // Controls
        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;

        // Stats
        this.stats = new Stats();
        document.body.appendChild(this.stats.dom);
    }

    setupScene() {
        // Lights
        const ambientLight = new AmbientLight(0x404040);
        this.scene.add(ambientLight);

        const directionalLight = new DirectionalLight(0xffffff, 1);
        directionalLight.position.set(5, 5, 5);
        directionalLight.castShadow = true;
        this.scene.add(directionalLight);

        // Set scene background
        this.scene.background = new Color(0x1e1e1e);
    }

    setupHelpers() {
        // Grid helper
        const gridHelper = new GridHelper(10, 10);
        this.scene.add(gridHelper);

        // Axes helper
        const axesHelper = new AxesHelper(5);
        this.scene.add(axesHelper);
    }

    setupEvents() {
        // Window resize
        window.addEventListener('resize', () => {
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(window.innerWidth, window.innerHeight);
        });

        // Setup UI events
        this.setupUIEvents();
    }

    setupUIEvents() {
        // Transform controls
        document.querySelector('.mdi-cursor-move').parentElement.addEventListener('click', () => {
            this.setTransformMode('translate');
        });

        document.querySelector('.mdi-rotate-3d').parentElement.addEventListener('click', () => {
            this.setTransformMode('rotate');
        });

        document.querySelector('.mdi-arrow-expand-all').parentElement.addEventListener('click', () => {
            this.setTransformMode('scale');
        });

        // View helpers
        document.querySelector('.mdi-grid').parentElement.addEventListener('click', (e) => {
            const button = e.currentTarget;
            button.classList.toggle('active');
            this.toggleGrid();
        });

        document.querySelector('.mdi-axis-arrow').parentElement.addEventListener('click', (e) => {
            const button = e.currentTarget;
            button.classList.toggle('active');
            this.toggleAxes();
        });
    }

    setTransformMode(mode) {
        // Remove active class from all transform buttons
        document.querySelectorAll('.viewport-toolbar .button').forEach(btn => {
            btn.classList.remove('active');
        });

        // Add active class to clicked button
        document.querySelector(`.mdi-${mode === 'translate' ? 'cursor-move' : 
            mode === 'rotate' ? 'rotate-3d' : 'arrow-expand-all'}`).parentElement.classList.add('active');

        // TODO: Implement transform controls
    }

    toggleGrid() {
        const grid = this.scene.getObjectByName('grid');
        if (grid) grid.visible = !grid.visible;
    }

    toggleAxes() {
        const axes = this.scene.getObjectByName('axes');
        if (axes) axes.visible = !axes.visible;
    }

    animate() {
        requestAnimationFrame(() => this.animate());

        this.controls.update();
        this.stats.update();
        this.renderer.render(this.scene, this.camera);

        // Update FPS counter
        document.querySelector('.mdi-clock-outline').parentElement.textContent = 
            ` ${Math.round(this.stats.getFPS())} FPS`;
    }

    // Scene management methods
    addObject(object) {
        this.scene.add(object);
        this.objects.set(object.uuid, object);
        this.updateObjectCount();
    }

    removeObject(object) {
        this.scene.remove(object);
        this.objects.delete(object.uuid);
        this.updateObjectCount();
    }

    selectObject(object) {
        if (this.selectedObject) {
            // Remove highlight from previously selected object
            this.selectedObject.material.emissive?.setHex(0x000000);
        }

        this.selectedObject = object;
        if (object) {
            // Highlight selected object
            object.material.emissive?.setHex(0x666666);
            this.updateProperties(object);
        }
    }

    updateObjectCount() {
        document.querySelector('.mdi-cube').parentElement.textContent = 
            ` ${this.objects.size} Objects`;
    }

    updateProperties(object) {
        // Update transform inputs
        const position = document.querySelector('input[value="0, 0, 0"]');
        const rotation = document.querySelector('input[value="0, 0, 0"]');
        const scale = document.querySelector('input[value="1, 1, 1"]');

        if (object) {
            position.value = `${object.position.x.toFixed(2)}, ${object.position.y.toFixed(2)}, ${object.position.z.toFixed(2)}`;
            rotation.value = `${(object.rotation.x * 180 / Math.PI).toFixed(2)}, ${(object.rotation.y * 180 / Math.PI).toFixed(2)}, ${(object.rotation.z * 180 / Math.PI).toFixed(2)}`;
            scale.value = `${object.scale.x.toFixed(2)}, ${object.scale.y.toFixed(2)}, ${object.scale.z.toFixed(2)}`;
        }
    }
}

// Create container
const container = document.createElement('div');
container.style.width = '100vw';
container.style.height = '100vh';
container.style.position = 'fixed';
container.style.top = '0';
container.style.left = '0';
document.body.appendChild(container);

// Initialize studio
const studio = new Studio(container);
const ui = new StudioUI(studio);

// Set up selection change callback
studio.onSelectionChange = (object) => {
    ui.updateHierarchy();
    ui.updateProperties(object);
};

// Add keyboard shortcuts
document.addEventListener('keydown', (event) => {
    // Delete selected object
    if (event.key === 'Delete' && studio.transformControls.selectedObject) {
        const object = studio.transformControls.selectedObject;
        studio.removeObject(object);
        ui.updateHierarchy();
    }

    // Transform mode shortcuts
    if (event.key === 'w' || event.key === 'e' || event.key === 'r') {
        const mode = event.key === 'w' ? 'translate' :
                    event.key === 'e' ? 'rotate' :
                    'scale';
        studio.setTransformMode(mode);
        ui.updateToolbar(mode);
    }

    // Space toggle
    if (event.key === 'x') {
        const space = studio.transformControls.space === 'world' ? 'local' : 'world';
        studio.setTransformSpace(space);
        ui.updateToolbar(undefined, space);
    }

    // Snap toggle
    if (event.key === 'v') {
        const snap = !studio.transformControls.snap;
        studio.setTransformSnap(snap);
        ui.updateToolbar(undefined, undefined, snap);
    }

    // Focus selected
    if (event.key === 'f' && studio.transformControls.selectedObject) {
        const object = studio.transformControls.selectedObject;
        const distance = 5;
        const direction = new Vector3(0, 0, 1).multiplyScalar(distance);
        studio.camera.position.copy(object.position).add(direction);
        studio.camera.lookAt(object.position);
    }
});

// Handle cleanup
window.addEventListener('beforeunload', () => {
    studio.dispose();
    ui.dispose();
});

// Add ground plane
const groundGeometry = new Plane(50, 50);
const groundMaterial = new MeshStandardMaterial({ color: 0x808080 });
const ground = new Mesh(groundGeometry, groundMaterial);
ground.rotation.x = -Math.PI / 2;
studio.addObject(ground);

// Add RigidBody component to ground
const groundBody = new RigidBody({
    type: 'static',
    shape: 'plane'
});
ground.add(groundBody);

// Add some example objects
function createBox(position) {
    const geometry = new Box(1, 1, 1);
    const material = new MeshStandardMaterial({ color: Math.random() * 0xffffff });
    const mesh = new Mesh(geometry, material);
    mesh.position.copy(position);
    
    // Add RigidBody component
    const rigidBody = new RigidBody({
        mass: 1,
        shape: 'box',
        size: { x: 1, y: 1, z: 1 }
    });
    mesh.add(rigidBody);
    
    studio.addObject(mesh);
    return mesh;
}

function createSphere(position) {
    const geometry = new Sphere(0.5);
    const material = new MeshStandardMaterial({ color: Math.random() * 0xffffff });
    const mesh = new Mesh(geometry, material);
    mesh.position.copy(position);
    
    // Add RigidBody component
    const rigidBody = new RigidBody({
        mass: 1,
        shape: 'sphere',
        radius: 0.5
    });
    mesh.add(rigidBody);
    
    studio.addObject(mesh);
    return mesh;
}

// Add some objects to the scene
createBox({ x: 0, y: 5, z: 0 });
createSphere({ x: 2, y: 7, z: 0 });
createBox({ x: -2, y: 9, z: 0 });

// Initialize editor
const editor = new Editor(); 