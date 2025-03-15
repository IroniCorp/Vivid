import { 
    Scene, 
    PerspectiveCamera, 
    WebGLRenderer, 
    Color, 
    AmbientLight, 
    DirectionalLight,
    Box3,
    BoxGeometry,
    SphereGeometry,
    CylinderGeometry,
    PlaneGeometry,
    MeshStandardMaterial,
    Mesh,
    Vector3,
    OrbitControls,
    AudioListener
} from 'three';
import { TransformControls } from './controls/TransformControls';
import { Physics } from '../core/physics/Physics';
import { PostProcessor } from '../core/postprocessing/PostProcessor';
import { BloomEffect, FXAAEffect, VignetteEffect } from '../core/postprocessing/effects/Effect';
import { RigidBody } from '../core/components/RigidBody';
import { AudioComponent } from '../core/components/Audio';
import { ParticleSystem } from '../core/components/ParticleSystem';

export class Studio {
    constructor(container) {
        this.container = container;
        this.scene = new Scene();
        this.camera = new PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        
        // Setup renderer
        this.renderer = new WebGLRenderer({ antialias: true });
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.container.appendChild(this.renderer.domElement);

        // Setup camera
        this.camera.position.set(0, 5, 10);
        this.camera.lookAt(0, 0, 0);

        // Setup orbit controls
        this.orbitControls = new OrbitControls(this.camera, this.renderer.domElement);
        this.orbitControls.enableDamping = true;
        this.orbitControls.dampingFactor = 0.05;

        // Setup lights
        this.setupLights();

        // Setup transform controls
        this.transformControls = new TransformControls(this.camera, this.renderer.domElement, this.scene);
        
        // Setup physics
        this.physics = new Physics({ gravity: -9.82, debug: true });
        this.scene.physicsSystem = this.physics;
        
        // Setup post-processing
        this.setupPostProcessing();

        // Setup event listeners
        this.setupEventListeners();

        // Object counter for unique names
        this.objectCounter = {
            Box: 0,
            Sphere: 0,
            Cylinder: 0,
            Plane: 0
        };

        // Animation loop
        this.animate = this.animate.bind(this);
        this.lastTime = 0;
        this.animate();
    }

    setupLights() {
        const ambientLight = new AmbientLight(0x404040);
        this.scene.add(ambientLight);

        const directionalLight = new DirectionalLight(0xffffff, 1);
        directionalLight.position.set(10, 10, 10);
        this.scene.add(directionalLight);
    }

    setupPostProcessing() {
        this.postProcessor = new PostProcessor(this.renderer);
        
        this.effects = {
            bloom: new BloomEffect({ threshold: 0.8, intensity: 1.5 }),
            fxaa: new FXAAEffect(),
            vignette: new VignetteEffect({ offset: 0.8, darkness: 1.2 })
        };

        Object.values(this.effects).forEach(effect => {
            this.postProcessor.addEffect(effect);
        });
    }

    setupEventListeners() {
        window.addEventListener('resize', () => {
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(window.innerWidth, window.innerHeight);
            this.postProcessor.setSize(window.innerWidth, window.innerHeight);
        });

        this.transformControls.addEventListener('transformStart', () => {
            this.orbitControls.enabled = false;
            this.physics.setDebug(false);
        });

        this.transformControls.addEventListener('transformEnd', () => {
            this.orbitControls.enabled = true;
            this.physics.setDebug(true);
            
            if (this.transformControls.selectedObject) {
                const rigidBody = this.transformControls.selectedObject.getComponent?.('RigidBody');
                if (rigidBody) {
                    rigidBody.wakeUp();
                }
            }
        });
    }

    createObject(type) {
        let geometry, material, mesh;
        const color = new Color(Math.random() * 0xffffff);

        switch (type) {
            case 'Box':
                geometry = new BoxGeometry(1, 1, 1);
                break;
            case 'Sphere':
                geometry = new SphereGeometry(0.5, 32, 32);
                break;
            case 'Cylinder':
                geometry = new CylinderGeometry(0.5, 0.5, 1, 32);
                break;
            case 'Plane':
                geometry = new PlaneGeometry(1, 1);
                break;
            default:
                console.warn(`Unknown object type: ${type}`);
                return;
        }

        material = new MeshStandardMaterial({ color });
        mesh = new Mesh(geometry, material);
        
        this.objectCounter[type]++;
        mesh.name = `${type}_${this.objectCounter[type]}`;
        mesh.position.set(0, 3, 0);

        this.addObject(mesh);
        this.selectObject(mesh);

        return mesh;
    }

    addComponent(object, type) {
        if (!object) return;

        let component;
        switch (type) {
            case 'RigidBody':
                const size = new Vector3(1, 1, 1);
                if (object.geometry) {
                    const boundingBox = new Box3().setFromObject(object);
                    boundingBox.getSize(size);
                }

                component = new RigidBody({
                    mass: 1,
                    shape: object.geometry instanceof BoxGeometry ? 'box' :
                           object.geometry instanceof SphereGeometry ? 'sphere' :
                           object.geometry instanceof CylinderGeometry ? 'cylinder' :
                           object.geometry instanceof PlaneGeometry ? 'plane' : 'box',
                    size
                });
                break;

            case 'Light':
                component = new DirectionalLight(0xffffff, 1);
                break;

            case 'Camera':
                component = new PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
                break;

            case 'Audio':
                // Create audio listener if it doesn't exist
                if (!this.scene.audioListener) {
                    const listener = new AudioListener();
                    this.camera.add(listener);
                    this.scene.audioListener = listener;
                }
                component = new AudioComponent({
                    positional: true,
                    volume: 1.0,
                    loop: false,
                    autoplay: false
                });
                break;

            case 'ParticleSystem':
                component = new ParticleSystem({
                    maxParticles: 1000,
                    particleSize: 0.1,
                    emissionRate: 50,
                    lifetime: 2,
                    startColor: new Color(1, 1, 1),
                    endColor: new Color(1, 1, 0),
                    startSize: 0.5,
                    endSize: 0.1,
                    startSpeed: 2,
                    endSpeed: 0.1,
                    spread: new Vector3(1, 1, 1),
                    gravity: new Vector3(0, -9.81, 0),
                    loop: true
                });
                break;
        }

        if (component) {
            if (!object.components) object.components = [];
            object.components.push(component);
            component.object = object;
            if (component.onAttach) component.onAttach();
        }
    }

    addObject(object) {
        this.scene.add(object);
    }

    removeObject(object) {
        this.scene.remove(object);
        if (this.transformControls.selectedObject === object) {
            this.transformControls.detach();
        }
    }

    selectObject(object) {
        if (this.transformControls.selectedObject) {
            this.transformControls.detach();
        }

        if (object && object !== this.scene) {
            this.transformControls.attach(object);
            this.transformControls.enabled = true;
        }

        if (this.onSelectionChange) {
            this.onSelectionChange(object);
        }
    }

    setTransformMode(mode) {
        this.transformControls.setMode(mode);
    }

    setTransformSpace(space) {
        this.transformControls.setSpace(space);
    }

    setTransformSnap(enabled, values) {
        this.transformControls.setSnap(enabled, values);
    }

    enableEffect(effectName, enabled) {
        const effect = this.effects[effectName];
        if (effect) {
            effect.enabled = enabled;
        }
    }

    setEffectParameter(effectName, parameter, value) {
        const effect = this.effects[effectName];
        if (effect && effect[`set${parameter}`]) {
            effect[`set${parameter}`](value);
        }
    }

    animate(time = 0) {
        requestAnimationFrame(this.animate);

        const deltaTime = (time - this.lastTime) / 1000;
        this.lastTime = time;

        this.orbitControls.update();
        this.physics.update(deltaTime);
        this.transformControls.update();

        Object.values(this.effects).forEach(effect => {
            if (effect.enabled) {
                effect.update(deltaTime);
            }
        });

        this.postProcessor.render(this.scene, this.camera);
    }

    dispose() {
        window.removeEventListener('resize', this.onResize);

        this.orbitControls.dispose();
        this.transformControls.dispose();

        this.renderer.dispose();
        this.scene.traverse(object => {
            if (object.geometry) object.geometry.dispose();
            if (object.material) {
                if (Array.isArray(object.material)) {
                    object.material.forEach(material => material.dispose());
                } else {
                    object.material.dispose();
                }
            }
            if (object.components) {
                object.components.forEach(component => {
                    if (component.dispose) component.dispose();
                });
            }
        });

        this.physics.dispose();
        this.postProcessor.dispose();
        Object.values(this.effects).forEach(effect => effect.dispose());
    }
} 