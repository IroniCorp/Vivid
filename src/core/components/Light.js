import { DirectionalLight, PointLight, SpotLight, Color } from 'three';
import { Component } from '../Component';

export class Light extends Component {
    constructor(options = {}) {
        super();

        this.type = options.type || 'directional';
        this.color = new Color(options.color || 0xffffff);
        this.intensity = options.intensity || 1;
        this.castShadow = options.castShadow || false;

        // Specific light properties
        this.distance = options.distance || 0;        // For Point and Spot lights
        this.decay = options.decay || 2;             // For Point and Spot lights
        this.angle = options.angle || Math.PI / 3;   // For Spot lights
        this.penumbra = options.penumbra || 0;       // For Spot lights

        // Create light based on type
        this._light = this._createLight();

        // Shadow settings
        if (this.castShadow) {
            this._setupShadows(options.shadow || {});
        }
    }

    _createLight() {
        switch (this.type) {
            case 'directional':
                return new DirectionalLight(this.color, this.intensity);
            case 'point':
                const pointLight = new PointLight(this.color, this.intensity, this.distance, this.decay);
                return pointLight;
            case 'spot':
                const spotLight = new SpotLight(
                    this.color, 
                    this.intensity,
                    this.distance,
                    this.angle,
                    this.penumbra,
                    this.decay
                );
                return spotLight;
            default:
                console.warn(`Unknown light type: ${this.type}, defaulting to directional`);
                return new DirectionalLight(this.color, this.intensity);
        }
    }

    _setupShadows(options = {}) {
        this._light.castShadow = true;
        
        // Shadow map settings
        this._light.shadow.mapSize.width = options.mapSize || 1024;
        this._light.shadow.mapSize.height = options.mapSize || 1024;
        
        // Camera settings
        this._light.shadow.camera.near = options.near || 0.5;
        this._light.shadow.camera.far = options.far || 500;

        if (this.type === 'directional') {
            const size = options.size || 5;
            this._light.shadow.camera.left = -size;
            this._light.shadow.camera.right = size;
            this._light.shadow.camera.top = size;
            this._light.shadow.camera.bottom = -size;
        }

        // Shadow bias and radius
        this._light.shadow.bias = options.bias || -0.0001;
        this._light.shadow.radius = options.radius || 1;
    }

    onAttach(object) {
        super.onAttach(object);
        
        // Sync light position with object
        this._light.position.copy(object.position);
        this._light.quaternion.copy(object.quaternion);
        
        // Add light to scene
        if (object.parent) {
            object.parent.add(this._light);
        }
    }

    onDetach() {
        // Remove light from scene
        if (this._light.parent) {
            this._light.parent.remove(this._light);
        }
        super.onDetach();
    }

    // Light properties
    setColor(color) {
        if (typeof color === 'string') {
            this._light.color = new Color(color);
        } else if (color instanceof Color) {
            this._light.color.copy(color);
        } else {
            this._light.color.setHex(color);
        }
    }

    setIntensity(intensity) {
        this._light.intensity = intensity;
    }

    // Point and Spot light properties
    setDistance(distance) {
        if (this.type !== 'directional') {
            this._light.distance = distance;
        }
    }

    setDecay(decay) {
        if (this.type !== 'directional') {
            this._light.decay = decay;
        }
    }

    // Spot light properties
    setAngle(angle) {
        if (this.type === 'spot') {
            this._light.angle = angle;
        }
    }

    setPenumbra(penumbra) {
        if (this.type === 'spot') {
            this._light.penumbra = penumbra;
        }
    }

    // Shadow properties
    setShadowMapSize(width, height) {
        if (this.castShadow) {
            this._light.shadow.mapSize.set(width, height);
            this._light.shadow.map?.dispose();
            this._light.shadow.map = null;
        }
    }

    setShadowBias(bias) {
        if (this.castShadow) {
            this._light.shadow.bias = bias;
        }
    }

    setShadowRadius(radius) {
        if (this.castShadow) {
            this._light.shadow.radius = radius;
        }
    }

    // Get the Three.js light instance
    getLight() {
        return this._light;
    }

    // Update light transform
    update() {
        if (this.object) {
            this._light.position.copy(this.object.position);
            this._light.quaternion.copy(this.object.quaternion);
        }
    }

    // Serialization
    toJSON() {
        const json = super.toJSON();
        json.type = this.type;
        json.color = this.color.getHex();
        json.intensity = this.intensity;
        json.castShadow = this.castShadow;
        
        if (this.type !== 'directional') {
            json.distance = this.distance;
            json.decay = this.decay;
        }
        
        if (this.type === 'spot') {
            json.angle = this.angle;
            json.penumbra = this.penumbra;
        }

        if (this.castShadow) {
            json.shadow = {
                mapSize: this._light.shadow.mapSize.toArray(),
                bias: this._light.shadow.bias,
                radius: this._light.shadow.radius,
                near: this._light.shadow.camera.near,
                far: this._light.shadow.camera.far
            };
        }

        return json;
    }

    fromJSON(json) {
        super.fromJSON(json);
        this.type = json.type;
        this.color = new Color(json.color);
        this.intensity = json.intensity;
        this.castShadow = json.castShadow;
        
        if (this.type !== 'directional') {
            this.distance = json.distance;
            this.decay = json.decay;
        }
        
        if (this.type === 'spot') {
            this.angle = json.angle;
            this.penumbra = json.penumbra;
        }

        // Recreate light with new settings
        this._light = this._createLight();
        
        if (this.castShadow && json.shadow) {
            this._setupShadows(json.shadow);
        }

        return this;
    }
} 