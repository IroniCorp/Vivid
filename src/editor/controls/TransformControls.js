import { 
    TransformControls as ThreeTransformControls,
    Vector3,
    Quaternion,
    Matrix4,
    Raycaster,
    Plane,
    Object3D
} from 'three';

export class TransformControls {
    constructor(camera, domElement, scene) {
        this.camera = camera;
        this.domElement = domElement;
        this.scene = scene;

        // Create Three.js transform controls
        this._controls = new ThreeTransformControls(camera, domElement);
        this._controls.setSize(0.8); // Slightly smaller gizmos

        // Transform settings
        this.mode = 'translate'; // translate, rotate, scale
        this.space = 'world';    // world or local
        this.snap = false;
        this.snapValues = {
            translate: 1,    // 1 unit
            rotate: Math.PI / 24, // 7.5 degrees
            scale: 0.1      // 0.1 units
        };

        // Selected object
        this.selectedObject = null;

        // Setup events
        this._setupEvents();
    }

    _setupEvents() {
        // Mode change events
        this._controls.addEventListener('mouseDown', () => {
            this.dispatchEvent({ type: 'transformStart' });
        });

        this._controls.addEventListener('mouseUp', () => {
            this.dispatchEvent({ type: 'transformEnd' });
        });

        this._controls.addEventListener('change', () => {
            this.dispatchEvent({ type: 'transformChange' });
        });

        // Handle object dragging
        this._controls.addEventListener('dragging-changed', (event) => {
            if (this.selectedObject) {
                // Update object transform component if available
                const transform = this.selectedObject.getComponent?.('Transform');
                if (transform) {
                    transform.updateFromObject();
                }
            }
            this.dispatchEvent({ type: 'transformUpdate', dragging: event.value });
        });

        // Handle control visibility
        this._controls.addEventListener('axis-changed', (event) => {
            this.dispatchEvent({ type: 'axisChange', axis: event.axis });
        });
    }

    // Selection management
    attach(object) {
        if (object instanceof Object3D) {
            this.selectedObject = object;
            this._controls.attach(object);
            this.scene.add(this._controls);
        }
    }

    detach() {
        this.selectedObject = null;
        this._controls.detach();
        this.scene.remove(this._controls);
    }

    // Transform mode management
    setMode(mode) {
        if (['translate', 'rotate', 'scale'].includes(mode)) {
            this.mode = mode;
            this._controls.setMode(mode);
        }
    }

    setSpace(space) {
        if (['world', 'local'].includes(space)) {
            this.space = space;
            this._controls.setSpace(space);
        }
    }

    // Snapping
    setSnap(enabled, values = null) {
        this.snap = enabled;
        if (values) {
            this.snapValues = { ...this.snapValues, ...values };
        }

        if (enabled) {
            switch (this.mode) {
                case 'translate':
                    this._controls.setTranslationSnap(this.snapValues.translate);
                    break;
                case 'rotate':
                    this._controls.setRotationSnap(this.snapValues.rotate);
                    break;
                case 'scale':
                    this._controls.setScaleSnap(this.snapValues.scale);
                    break;
            }
        } else {
            this._controls.setTranslationSnap(null);
            this._controls.setRotationSnap(null);
            this._controls.setScaleSnap(null);
        }
    }

    // Size management
    setSize(size) {
        this._controls.setSize(size);
    }

    // Visibility
    setVisible(visible) {
        this._controls.visible = visible;
    }

    // Enable/disable
    enable() {
        this._controls.enabled = true;
    }

    disable() {
        this._controls.enabled = false;
    }

    // Update controls
    update() {
        if (this.selectedObject && this._controls.visible) {
            this._controls.update();
        }
    }

    // Event handling
    addEventListener(type, listener) {
        this._controls.addEventListener(type, listener);
    }

    removeEventListener(type, listener) {
        this._controls.removeEventListener(type, listener);
    }

    dispatchEvent(event) {
        this._controls.dispatchEvent(event);
    }

    // Cleanup
    dispose() {
        this.detach();
        this._controls.dispose();
    }
} 