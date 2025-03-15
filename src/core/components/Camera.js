import { PerspectiveCamera, OrthographicCamera, Vector3, Quaternion, Matrix4 } from 'three';
import { Component } from '../Component';

export class Camera extends Component {
    constructor(options = {}) {
        super();

        this.type = options.type || 'perspective';
        this.active = options.active || false;

        // Camera settings
        this.fov = options.fov || 75;
        this.aspect = options.aspect || window.innerWidth / window.innerHeight;
        this.near = options.near || 0.1;
        this.far = options.far || 1000;
        
        // For orthographic camera
        this.left = options.left || -10;
        this.right = options.right || 10;
        this.top = options.top || 10;
        this.bottom = options.bottom || -10;

        // Create camera based on type
        this._camera = this.type === 'perspective' 
            ? new PerspectiveCamera(this.fov, this.aspect, this.near, this.far)
            : new OrthographicCamera(this.left, this.right, this.top, this.bottom, this.near, this.far);

        // Camera transform
        this.target = new Vector3(0, 0, 0);
        this._up = new Vector3(0, 1, 0);
        this._direction = new Vector3(0, 0, -1);
    }

    onAttach(object) {
        super.onAttach(object);
        
        // Sync camera position with object
        this._camera.position.copy(object.position);
        this._camera.quaternion.copy(object.quaternion);
        this._camera.updateMatrix();
        this._camera.updateMatrixWorld();

        // Register as scene camera if active
        if (this.active && object.parent) {
            object.parent.activeCamera = this;
        }
    }

    onDetach() {
        // Remove as scene camera if active
        if (this.active && this.object && this.object.parent) {
            if (this.object.parent.activeCamera === this) {
                this.object.parent.activeCamera = null;
            }
        }
        super.onDetach();
    }

    // Camera operations
    lookAt(target) {
        if (target instanceof Vector3) {
            this.target.copy(target);
        } else {
            this.target.set(target.x || 0, target.y || 0, target.z || 0);
        }
        
        this._camera.lookAt(this.target);
        this.object.quaternion.copy(this._camera.quaternion);
    }

    setFOV(fov) {
        if (this.type === 'perspective') {
            this.fov = fov;
            this._camera.fov = fov;
            this._camera.updateProjectionMatrix();
        }
    }

    setAspect(aspect) {
        if (this.type === 'perspective') {
            this.aspect = aspect;
            this._camera.aspect = aspect;
            this._camera.updateProjectionMatrix();
        }
    }

    setOrthographicSize(size) {
        if (this.type === 'orthographic') {
            const aspect = window.innerWidth / window.innerHeight;
            this.left = -size * aspect;
            this.right = size * aspect;
            this.top = size;
            this.bottom = -size;
            
            this._camera.left = this.left;
            this._camera.right = this.right;
            this._camera.top = this.top;
            this._camera.bottom = this.bottom;
            this._camera.updateProjectionMatrix();
        }
    }

    // Viewport management
    setViewport(x, y, width, height) {
        this._camera.setViewport(x, y, width, height);
    }

    // Update camera matrices
    updateMatrices() {
        this._camera.updateMatrix();
        this._camera.updateMatrixWorld();
        this._camera.updateProjectionMatrix();
    }

    // Get camera properties
    getWorldDirection(target) {
        return this._camera.getWorldDirection(target);
    }

    getWorldPosition(target) {
        return this._camera.getWorldPosition(target);
    }

    // Get the Three.js camera instance
    getCamera() {
        return this._camera;
    }

    // Handle window resize
    handleResize() {
        if (this.type === 'perspective') {
            this.setAspect(window.innerWidth / window.innerHeight);
        } else {
            this.setOrthographicSize(this.top); // Maintain current size but update aspect
        }
    }

    // Serialization
    toJSON() {
        const json = super.toJSON();
        json.type = this.type;
        json.active = this.active;
        json.fov = this.fov;
        json.aspect = this.aspect;
        json.near = this.near;
        json.far = this.far;
        json.left = this.left;
        json.right = this.right;
        json.top = this.top;
        json.bottom = this.bottom;
        json.target = this.target.toArray();
        return json;
    }

    fromJSON(json) {
        super.fromJSON(json);
        this.type = json.type;
        this.active = json.active;
        this.fov = json.fov;
        this.aspect = json.aspect;
        this.near = json.near;
        this.far = json.far;
        this.left = json.left;
        this.right = json.right;
        this.top = json.top;
        this.bottom = json.bottom;
        this.target.fromArray(json.target);
        
        // Recreate camera with new settings
        this._camera = this.type === 'perspective'
            ? new PerspectiveCamera(this.fov, this.aspect, this.near, this.far)
            : new OrthographicCamera(this.left, this.right, this.top, this.bottom, this.near, this.far);
        
        return this;
    }
} 