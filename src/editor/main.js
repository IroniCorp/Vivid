import { 
    Scene, 
    WebGLRenderer, 
    PerspectiveCamera, 
    DirectionalLight, 
    AmbientLight,
    GridHelper, 
    AxesHelper,
    Vector3,
    PlaneGeometry,
    MeshStandardMaterial,
    Mesh,
    TextureLoader, 
    AudioLoader, 
    Clock 
} from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import Stats from 'three/examples/jsm/libs/stats.module.js';
import { Studio } from './Studio';
import { StudioUI } from './StudioUI';
import { VisualScripting } from '../core/scripting/VisualScripting';
import { TerrainSystem } from '../core/terrain/TerrainSystem';
import { AssetBrowser } from './AssetBrowser';
import { UndoRedoManager } from './UndoRedoManager';
import { ProjectManager } from './ProjectManager';

// Global clock for animation and timing
const clock = new Clock();

class Editor {
    constructor() {
        // Core setup
        this.scene = new Scene();
        this.camera = new PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.renderer = new WebGLRenderer({ antialias: true });
        this.controls = null;
        this.stats = new Stats();
        this.objects = new Map();
        this.selectedObject = null;
        this.textureLoader = new TextureLoader();
        this.audioLoader = new AudioLoader();
        
        try {
            // Initialize core systems
            this.init();
            this.setupScene();
            this.setupHelpers();

            // Initialize studio
            this.studio = new Studio(this.scene);
            this.studioUI = new StudioUI(this.studio);

            // Initialize advanced systems
            this.visualScripting = new VisualScripting(this.scene);
            this.terrainSystem = new TerrainSystem(this.scene, this.renderer);
            this.assetBrowser = new AssetBrowser(document.getElementById('asset-browser'));
            this.undoRedoManager = new UndoRedoManager();
            this.projectManager = new ProjectManager(this);

            // Setup events and menu listeners
            this.setupEvents();
            this.setupMenuListeners();

            // Start animation loop
            this.animate();

            // Create and start fade-in effect
            const fadeOverlay = document.createElement('div');
            fadeOverlay.style.position = 'fixed';
            fadeOverlay.style.top = '0';
            fadeOverlay.style.left = '0';
            fadeOverlay.style.width = '100%';
            fadeOverlay.style.height = '100%';
            fadeOverlay.style.backgroundColor = '#1e1e1e';
            fadeOverlay.style.opacity = '1';
            fadeOverlay.style.transition = 'opacity 0.5s ease';
            fadeOverlay.style.zIndex = '9999';
            document.body.appendChild(fadeOverlay);

            // Trigger fade-in
            requestAnimationFrame(() => {
                fadeOverlay.style.opacity = '0';
                setTimeout(() => fadeOverlay.remove(), 500);
            });
        } catch (error) {
            console.error('Error initializing editor:', error);
            this.handleInitializationError(error);
        }
    }

    handleInitializationError(error) {
        const errorOverlay = document.createElement('div');
        errorOverlay.style.position = 'fixed';
        errorOverlay.style.top = '0';
        errorOverlay.style.left = '0';
        errorOverlay.style.width = '100%';
        errorOverlay.style.height = '100%';
        errorOverlay.style.backgroundColor = '#1e1e1e';
        errorOverlay.style.color = '#ff4444';
        errorOverlay.style.display = 'flex';
        errorOverlay.style.alignItems = 'center';
        errorOverlay.style.justifyContent = 'center';
        errorOverlay.style.zIndex = '9999';
        errorOverlay.innerHTML = `
            <div style="text-align: center;">
                <h2>Error Initializing Editor</h2>
                <p>${error.message}</p>
                <button onclick="location.reload()" style="margin-top: 20px; padding: 10px 20px;">
                    Retry
                </button>
            </div>
        `;
        document.body.appendChild(errorOverlay);
    }

    init() {
        const viewport = document.getElementById('viewport-canvas');
        if (!viewport) {
            throw new Error('Viewport canvas not found');
        }

        // Setup renderer
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.shadowMap.enabled = true;
        viewport.appendChild(this.renderer.domElement);

        // Setup camera
        this.camera.position.set(0, 5, 10);
        this.camera.lookAt(0, 0, 0);

        // Setup controls
        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;

        // Setup stats
        const statsContainer = document.getElementById('stats');
        if (!statsContainer) {
            throw new Error('Stats container not found');
        }
        statsContainer.appendChild(this.stats.dom);
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
            new PlaneGeometry(20, 20),
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
        if (this.studio) this.studio.dispose();
        if (this.studioUI) this.studioUI.dispose();

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

// Initialize editor
const editor = new Editor();

// Handle cleanup
window.addEventListener('beforeunload', () => {
    editor.dispose();
}); 