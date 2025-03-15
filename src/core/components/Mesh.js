import { 
    Mesh as ThreeMesh, 
    BoxGeometry,
    SphereGeometry,
    CylinderGeometry,
    PlaneGeometry,
    MeshStandardMaterial,
    BufferGeometry,
    Vector3,
    Box3
} from 'three';
import { Component } from '../Component';

export class Mesh extends Component {
    constructor(options = {}) {
        super();

        this.type = options.type || 'box';
        this._geometry = null;
        this._material = null;
        this._mesh = null;

        // Geometry parameters
        this.parameters = {
            ...this._getDefaultParameters(),
            ...options.parameters
        };

        // Create geometry and material
        this._createGeometry();
        this._createMaterial(options.material);

        // Create mesh
        this._mesh = new ThreeMesh(this._geometry, this._material);
        this._mesh.castShadow = options.castShadow || false;
        this._mesh.receiveShadow = options.receiveShadow || false;
    }

    _getDefaultParameters() {
        switch (this.type) {
            case 'box':
                return {
                    width: 1,
                    height: 1,
                    depth: 1,
                    widthSegments: 1,
                    heightSegments: 1,
                    depthSegments: 1
                };
            case 'sphere':
                return {
                    radius: 1,
                    widthSegments: 32,
                    heightSegments: 16,
                    phiStart: 0,
                    phiLength: Math.PI * 2,
                    thetaStart: 0,
                    thetaLength: Math.PI
                };
            case 'cylinder':
                return {
                    radiusTop: 1,
                    radiusBottom: 1,
                    height: 1,
                    radialSegments: 32,
                    heightSegments: 1,
                    openEnded: false
                };
            case 'plane':
                return {
                    width: 1,
                    height: 1,
                    widthSegments: 1,
                    heightSegments: 1
                };
            default:
                return {};
        }
    }

    _createGeometry() {
        switch (this.type) {
            case 'box':
                this._geometry = new BoxGeometry(
                    this.parameters.width,
                    this.parameters.height,
                    this.parameters.depth,
                    this.parameters.widthSegments,
                    this.parameters.heightSegments,
                    this.parameters.depthSegments
                );
                break;
            case 'sphere':
                this._geometry = new SphereGeometry(
                    this.parameters.radius,
                    this.parameters.widthSegments,
                    this.parameters.heightSegments,
                    this.parameters.phiStart,
                    this.parameters.phiLength,
                    this.parameters.thetaStart,
                    this.parameters.thetaLength
                );
                break;
            case 'cylinder':
                this._geometry = new CylinderGeometry(
                    this.parameters.radiusTop,
                    this.parameters.radiusBottom,
                    this.parameters.height,
                    this.parameters.radialSegments,
                    this.parameters.heightSegments,
                    this.parameters.openEnded
                );
                break;
            case 'plane':
                this._geometry = new PlaneGeometry(
                    this.parameters.width,
                    this.parameters.height,
                    this.parameters.widthSegments,
                    this.parameters.heightSegments
                );
                break;
            default:
                console.warn(`Unknown geometry type: ${this.type}, defaulting to box`);
                this._geometry = new BoxGeometry(1, 1, 1);
        }
    }

    _createMaterial(materialOptions = {}) {
        this._material = new MeshStandardMaterial({
            color: materialOptions.color || 0xcccccc,
            roughness: materialOptions.roughness !== undefined ? materialOptions.roughness : 0.5,
            metalness: materialOptions.metalness !== undefined ? materialOptions.metalness : 0.5,
            ...materialOptions
        });
    }

    onAttach(object) {
        super.onAttach(object);
        
        // Add mesh to object
        this.object.add(this._mesh);
    }

    onDetach() {
        // Remove mesh from object
        if (this._mesh.parent) {
            this._mesh.parent.remove(this._mesh);
        }
        super.onDetach();
    }

    // Geometry operations
    setGeometry(geometry) {
        if (geometry instanceof BufferGeometry) {
            if (this._geometry) {
                this._geometry.dispose();
            }
            this._geometry = geometry;
            this._mesh.geometry = this._geometry;
        }
    }

    updateGeometry(parameters) {
        this.parameters = { ...this.parameters, ...parameters };
        const oldGeometry = this._geometry;
        this._createGeometry();
        this._mesh.geometry = this._geometry;
        oldGeometry.dispose();
    }

    // Material operations
    setMaterial(material) {
        if (material instanceof MeshStandardMaterial) {
            if (this._material) {
                this._material.dispose();
            }
            this._material = material;
            this._mesh.material = this._material;
        }
    }

    updateMaterial(parameters) {
        Object.assign(this._material, parameters);
        this._material.needsUpdate = true;
    }

    // Mesh properties
    setCastShadow(value) {
        this._mesh.castShadow = value;
    }

    setReceiveShadow(value) {
        this._mesh.receiveShadow = value;
    }

    // Utility methods
    computeBoundingBox() {
        this._geometry.computeBoundingBox();
        return this._geometry.boundingBox;
    }

    computeBoundingSphere() {
        this._geometry.computeBoundingSphere();
        return this._geometry.boundingSphere;
    }

    getCenter(target = new Vector3()) {
        const boundingBox = new Box3().setFromObject(this._mesh);
        return boundingBox.getCenter(target);
    }

    // Get the Three.js mesh instance
    getMesh() {
        return this._mesh;
    }

    // Resource cleanup
    dispose() {
        if (this._geometry) {
            this._geometry.dispose();
        }
        if (this._material) {
            this._material.dispose();
        }
    }

    // Serialization
    toJSON() {
        const json = super.toJSON();
        json.type = this.type;
        json.parameters = this.parameters;
        json.material = {
            color: this._material.color.getHex(),
            roughness: this._material.roughness,
            metalness: this._material.metalness,
            transparent: this._material.transparent,
            opacity: this._material.opacity
        };
        json.castShadow = this._mesh.castShadow;
        json.receiveShadow = this._mesh.receiveShadow;
        return json;
    }

    fromJSON(json) {
        super.fromJSON(json);
        this.type = json.type;
        this.parameters = json.parameters;
        
        // Recreate geometry and material
        this._createGeometry();
        this._createMaterial(json.material);
        
        // Recreate mesh
        if (this._mesh) {
            this._mesh.geometry = this._geometry;
            this._mesh.material = this._material;
            this._mesh.castShadow = json.castShadow;
            this._mesh.receiveShadow = json.receiveShadow;
        } else {
            this._mesh = new ThreeMesh(this._geometry, this._material);
            this._mesh.castShadow = json.castShadow;
            this._mesh.receiveShadow = json.receiveShadow;
        }
        
        return this;
    }
} 