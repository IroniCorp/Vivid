import { Scene as ThreeScene, Color, Fog, Object3D } from 'three';

export class Scene extends ThreeScene {
    constructor(options = {}) {
        super();

        this.name = options.name || 'Scene';
        this.background = new Color(options.background || 0x000000);
        
        if (options.fog) {
            this.fog = new Fog(options.fog.color || 0x000000, options.fog.near || 1, options.fog.far || 1000);
        }

        this._objects = new Map();
        this._scripts = new Map();
        this._systems = new Map();
    }

    // Object Management
    addObject(object) {
        if (object instanceof Object3D) {
            this.add(object);
            this._objects.set(object.uuid, object);
            this._initializeObject(object);
            return object;
        }
        throw new Error('Object must be an instance of Object3D');
    }

    removeObject(object) {
        if (this._objects.has(object.uuid)) {
            this.remove(object);
            this._objects.delete(object.uuid);
            this._cleanupObject(object);
            return true;
        }
        return false;
    }

    getObject(uuid) {
        return this._objects.get(uuid);
    }

    // Script Management
    attachScript(object, script) {
        if (!this._scripts.has(object.uuid)) {
            this._scripts.set(object.uuid, new Set());
        }
        this._scripts.get(object.uuid).add(script);
        script.onAttach(object);
    }

    detachScript(object, script) {
        if (this._scripts.has(object.uuid)) {
            script.onDetach();
            return this._scripts.get(object.uuid).delete(script);
        }
        return false;
    }

    // System Management
    addSystem(system) {
        this._systems.set(system.constructor.name, system);
        system.onAttach(this);
    }

    removeSystem(system) {
        system.onDetach();
        return this._systems.delete(system.constructor.name);
    }

    getSystem(name) {
        return this._systems.get(name);
    }

    // Update Loop
    update(deltaTime) {
        // Update systems
        for (const system of this._systems.values()) {
            system.update(deltaTime);
        }

        // Update scripts
        for (const [uuid, scripts] of this._scripts) {
            const object = this._objects.get(uuid);
            if (object) {
                for (const script of scripts) {
                    script.update(deltaTime);
                }
            }
        }
    }

    // Serialization
    toJSON() {
        const json = super.toJSON();
        json.objects = Array.from(this._objects.values()).map(obj => obj.toJSON());
        return json;
    }

    fromJSON(json) {
        // Clear current scene
        this.clear();
        this._objects.clear();
        this._scripts.clear();
        this._systems.clear();

        // Load scene data
        if (json.background) this.background = new Color(json.background);
        if (json.fog) this.fog = new Fog(json.fog.color, json.fog.near, json.fog.far);

        // Load objects
        if (json.objects) {
            json.objects.forEach(objData => {
                const object = new Object3D().fromJSON(objData);
                this.addObject(object);
            });
        }
    }

    // Private methods
    _initializeObject(object) {
        // Initialize components if any
        if (object.components) {
            object.components.forEach(component => {
                component.onAttach(object);
            });
        }
    }

    _cleanupObject(object) {
        // Cleanup components if any
        if (object.components) {
            object.components.forEach(component => {
                component.onDetach();
            });
        }

        // Remove associated scripts
        if (this._scripts.has(object.uuid)) {
            const scripts = this._scripts.get(object.uuid);
            scripts.forEach(script => script.onDetach());
            this._scripts.delete(object.uuid);
        }
    }
} 