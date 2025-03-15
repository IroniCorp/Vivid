export class Component {
    constructor() {
        this.object = null;
        this.enabled = true;
    }

    onAttach(object) {
        this.object = object;
        if (!object.components) {
            object.components = new Set();
        }
        object.components.add(this);
        this.onEnable();
    }

    onDetach() {
        if (this.object && this.object.components) {
            this.object.components.delete(this);
        }
        this.onDisable();
        this.object = null;
    }

    onEnable() {
        // Override in derived classes
    }

    onDisable() {
        // Override in derived classes
    }

    update(deltaTime) {
        // Override in derived classes
    }

    // Utility methods
    getComponent(type) {
        if (!this.object || !this.object.components) return null;
        for (const component of this.object.components) {
            if (component instanceof type) {
                return component;
            }
        }
        return null;
    }

    getComponents(type) {
        if (!this.object || !this.object.components) return [];
        return Array.from(this.object.components).filter(component => component instanceof type);
    }

    // Serialization
    toJSON() {
        return {
            type: this.constructor.name,
            enabled: this.enabled,
            // Add any additional properties that need to be serialized
        };
    }

    fromJSON(json) {
        this.enabled = json.enabled;
        // Restore any additional properties
        return this;
    }
} 