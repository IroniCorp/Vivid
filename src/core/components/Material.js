import { MeshStandardMaterial, Color, TextureLoader } from 'three';
import { Component } from '../Component';

export class Material extends Component {
    constructor(options = {}) {
        super();

        this.material = new MeshStandardMaterial({
            color: options.color || 0xffffff,
            roughness: options.roughness !== undefined ? options.roughness : 0.5,
            metalness: options.metalness !== undefined ? options.metalness : 0.5,
            transparent: options.transparent || false,
            opacity: options.opacity !== undefined ? options.opacity : 1.0
        });

        this.textureLoader = new TextureLoader();
        this._textures = new Map();
    }

    onAttach(object) {
        super.onAttach(object);
        if (this.object && this.object.material) {
            this._originalMaterial = this.object.material;
            this.object.material = this.material;
        }
    }

    onDetach() {
        if (this.object && this._originalMaterial) {
            this.object.material = this._originalMaterial;
        }
        this.disposeMaterial();
        super.onDetach();
    }

    // Material properties
    setColor(color) {
        if (typeof color === 'string') {
            this.material.color = new Color(color);
        } else if (color instanceof Color) {
            this.material.color.copy(color);
        } else {
            this.material.color.setHex(color);
        }
    }

    setRoughness(value) {
        this.material.roughness = Math.max(0, Math.min(1, value));
    }

    setMetalness(value) {
        this.material.metalness = Math.max(0, Math.min(1, value));
    }

    setOpacity(value) {
        this.material.opacity = Math.max(0, Math.min(1, value));
        this.material.transparent = value < 1;
    }

    // Texture management
    async loadTexture(type, url) {
        try {
            const texture = await this.textureLoader.loadAsync(url);
            this._textures.set(type, texture);
            
            switch (type) {
                case 'map':
                    this.material.map = texture;
                    break;
                case 'normalMap':
                    this.material.normalMap = texture;
                    break;
                case 'roughnessMap':
                    this.material.roughnessMap = texture;
                    break;
                case 'metalnessMap':
                    this.material.metalnessMap = texture;
                    break;
                case 'aoMap':
                    this.material.aoMap = texture;
                    break;
                case 'emissiveMap':
                    this.material.emissiveMap = texture;
                    break;
                case 'displacementMap':
                    this.material.displacementMap = texture;
                    break;
            }

            this.material.needsUpdate = true;
            return texture;
        } catch (error) {
            console.error(`Failed to load texture: ${url}`, error);
            return null;
        }
    }

    removeTexture(type) {
        if (this._textures.has(type)) {
            const texture = this._textures.get(type);
            texture.dispose();
            this._textures.delete(type);

            this.material[type] = null;
            this.material.needsUpdate = true;
        }
    }

    // Material settings
    setDoubleSided(value) {
        this.material.side = value ? 2 : 0; // THREE.DoubleSide : THREE.FrontSide
    }

    setWireframe(value) {
        this.material.wireframe = value;
    }

    // Resource management
    disposeMaterial() {
        // Dispose textures
        for (const texture of this._textures.values()) {
            texture.dispose();
        }
        this._textures.clear();

        // Dispose material
        this.material.dispose();
    }

    // Serialization
    toJSON() {
        const json = super.toJSON();
        json.material = {
            color: this.material.color.getHex(),
            roughness: this.material.roughness,
            metalness: this.material.metalness,
            opacity: this.material.opacity,
            transparent: this.material.transparent,
            wireframe: this.material.wireframe,
            side: this.material.side
        };

        // Save texture URLs
        json.textures = {};
        for (const [type, texture] of this._textures) {
            if (texture.source.data.src) {
                json.textures[type] = texture.source.data.src;
            }
        }

        return json;
    }

    async fromJSON(json) {
        super.fromJSON(json);

        // Restore material properties
        if (json.material) {
            this.setColor(json.material.color);
            this.setRoughness(json.material.roughness);
            this.setMetalness(json.material.metalness);
            this.setOpacity(json.material.opacity);
            this.setDoubleSided(json.material.side === 2);
            this.setWireframe(json.material.wireframe);
        }

        // Restore textures
        if (json.textures) {
            for (const [type, url] of Object.entries(json.textures)) {
                await this.loadTexture(type, url);
            }
        }

        return this;
    }
} 