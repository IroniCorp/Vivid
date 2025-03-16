import { Scene, WebGLRenderer, PerspectiveCamera, DirectionalLight, AmbientLight, 
    GridHelper, AxesHelper, Box3, Vector3, Color, TextureLoader, AudioLoader, Clock } from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import Stats from 'three/examples/jsm/libs/stats.module.js';
import { Studio } from './Studio';
import { StudioUI } from './StudioUI';
import { Box, Sphere, Plane, MeshStandardMaterial, Mesh } from 'three';
import { RigidBody } from '../core/components/RigidBody';
import { VisualScripting } from '../core/scripting/VisualScripting';
import { TerrainSystem } from '../core/terrain/TerrainSystem';
import { AssetBrowser } from './AssetBrowser';
import { UndoRedoManager } from './UndoRedoManager';
import { ProjectManager } from './ProjectManager';

// Global clock for animation and timing
const clock = new Clock();

class Editor {
    constructor() {
        this.scene = new Scene();
        this.camera = new PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.renderer = new WebGLRenderer({ antialias: true });
        this.controls = null;
        this.stats = new Stats();
        this.objects = new Map();
        this.selectedObject = null;
        this.textureLoader = new TextureLoader();
        this.audioLoader = new AudioLoader();
        
        // Advanced systems
        this.visualScripting = null;
        this.terrainSystem = null;
        this.assetBrowser = null;
        this.undoRedoManager = null;
        this.projectManager = null;

        // Initialize the editor
        this.init();
        this.setupScene();
        this.setupHelpers();
        this.setupAdvancedSystems();
        this.setupEvents();
        this.animate();
    }

    init() {
        // Setup renderer
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.shadowMap.enabled = true;
        document.getElementById('viewport-canvas').appendChild(this.renderer.domElement);

        // Setup camera
        this.camera.position.set(0, 5, 10);
        this.camera.lookAt(0, 0, 0);

        // Setup controls
        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;

        // Setup stats
        document.getElementById('stats').appendChild(this.stats.dom);
    }

    setupScene() {
        // Setup default lighting
        const ambientLight = new AmbientLight(0xffffff, 0.5);
        this.scene.add(ambientLight);

        const directionalLight = new DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(5, 5, 5);
        directionalLight.castShadow = true;
        this.scene.add(directionalLight);

        // Setup default ground
        const ground = new Mesh(
            new Plane(20, 20),
            new MeshStandardMaterial({ color: 0x808080, roughness: 0.8, metalness: 0.2 })
        );
        ground.rotation.x = -Math.PI / 2;
        ground.receiveShadow = true;
        this.scene.add(ground);
    }

    setupHelpers() {
        // Grid helper
        const grid = new GridHelper(20, 20);
        this.scene.add(grid);

        // Axes helper
        const axes = new AxesHelper(5);
        this.scene.add(axes);
    }

    setupAdvancedSystems() {
        // Initialize visual scripting system
        this.visualScripting = new VisualScripting(this.scene);
        
        // Initialize terrain system
        this.terrainSystem = new TerrainSystem(this.scene, this.renderer);
        
        // Initialize asset browser
        this.assetBrowser = new AssetBrowser(document.getElementById('asset-browser'));
        
        // Initialize undo/redo system
        this.undoRedoManager = new UndoRedoManager();
        
        // Initialize project management
        this.projectManager = new ProjectManager(this);

        // Setup menu event listeners
        this.setupMenuListeners();
    }

    setupMenuListeners() {
        // New project
        document.getElementById('new-project').addEventListener('click', () => {
            this.projectManager.createProject();
        });

        // Open project
        document.getElementById('open-project').addEventListener('click', () => {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = '.vivid';
            input.onchange = (e) => {
                if (e.target.files.length > 0) {
                    this.projectManager.loadProject(e.target.files[0]);
                }
            };
            input.click();
        });

        // Save project
        document.getElementById('save-project').addEventListener('click', () => {
            this.projectManager.saveProject();
        });

        // Project settings
        document.getElementById('project-settings').addEventListener('click', () => {
            // TODO: Implement settings dialog
        });

        // Add object button
        document.getElementById('add-object').addEventListener('click', () => {
            this.showAddObjectMenu();
        });
    }

    showAddObjectMenu() {
        const menu = document.createElement('div');
        menu.className = 'context-menu';
        const button = document.getElementById('add-object');
        const rect = button.getBoundingClientRect();
        
        menu.style.left = `${rect.left}px`;
        menu.style.top = `${rect.bottom}px`;
        
        menu.innerHTML = `
            <ul>
                <li data-type="Box">Box</li>
                <li data-type="Sphere">Sphere</li>
                <li data-type="Cylinder">Cylinder</li>
                <li data-type="Plane">Plane</li>
                <li data-type="Light">Light</li>
                <li data-type="Camera">Camera</li>
            </ul>
        `;
        
        document.body.appendChild(menu);
        
        menu.querySelectorAll('li').forEach(item => {
            item.addEventListener('click', () => {
                const type = item.dataset.type;
                this.createObject(type);
                menu.remove();
            });
        });
        
        // Remove menu when clicking outside
        const removeMenu = () => {
            menu.remove();
            document.removeEventListener('click', removeMenu);
        };
        document.addEventListener('click', removeMenu);
    }

    createObject(type, options = {}) {
        const object = this.studio.createObject(type, options);
        this.undoRedoManager.addAddObjectAction(object, this.scene);
        return object;
    }

    setupEvents() {
        // Window resize
        window.addEventListener('resize', () => {
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(window.innerWidth, window.innerHeight);
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            // Undo/Redo
            if (e.ctrlKey || e.metaKey) {
                if (e.key === 'z' && !e.shiftKey) {
                    e.preventDefault();
                    this.undoRedoManager.undo();
                } else if ((e.key === 'Z' || (e.key === 'z' && e.shiftKey))) {
                    e.preventDefault();
                    this.undoRedoManager.redo();
                }
            }
        });
    }

    animate() {
        requestAnimationFrame(() => this.animate());

        // Update controls
        this.controls.update();

        // Update stats
        this.stats.update();

        // Update visual scripting
        if (this.visualScripting) {
            this.visualScripting.update(clock.getDelta());
        }

        // Update terrain system
        if (this.terrainSystem) {
            this.terrainSystem.update();
        }

        // Render scene
        this.renderer.render(this.scene, this.camera);
    }

    dispose() {
        // Dispose of advanced systems
        if (this.visualScripting) this.visualScripting.dispose();
        if (this.terrainSystem) this.terrainSystem.dispose();
        if (this.assetBrowser) this.assetBrowser.dispose();
        if (this.projectManager) this.projectManager.dispose();

        // Remove event listeners
        window.removeEventListener('resize', this.onWindowResize);

        // Dispose of Three.js resources
        this.scene.traverse(object => {
            if (object.geometry) object.geometry.dispose();
            if (object.material) {
                if (Array.isArray(object.material)) {
                    object.material.forEach(material => material.dispose());
                } else {
                    object.material.dispose();
                }
            }
        });

        this.renderer.dispose();
    }
}

// Remove loading screen with fade effect
const loadingScreen = document.querySelector('.loading-screen');
loadingScreen.style.opacity = '0';
loadingScreen.style.transition = 'opacity 0.5s ease';
setTimeout(() => {
    loadingScreen.remove();
}, 500);

// Initialize editor
const editor = new Editor();

// Handle cleanup
window.addEventListener('beforeunload', () => {
    editor.dispose();
}); 