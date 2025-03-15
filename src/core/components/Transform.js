import { Vector3, Quaternion, Euler, Matrix4 } from 'three';
import { Component } from '../Component';

export class Transform extends Component {
    constructor() {
        super();
        
        this.position = new Vector3();
        this.rotation = new Euler();
        this.scale = new Vector3(1, 1, 1);
        this.quaternion = new Quaternion();
        this.matrix = new Matrix4();
        this.worldMatrix = new Matrix4();

        this._parent = null;
        this._children = new Set();
        this._dirty = true;
    }

    onAttach(object) {
        super.onAttach(object);
        this.updateFromObject();
    }

    updateFromObject() {
        if (this.object) {
            this.position.copy(this.object.position);
            this.rotation.copy(this.object.rotation);
            this.scale.copy(this.object.scale);
            this.quaternion.copy(this.object.quaternion);
            this.matrix.copy(this.object.matrix);
            this.worldMatrix.copy(this.object.matrixWorld);
        }
    }

    // Position methods
    setPosition(x, y, z) {
        this.position.set(x, y, z);
        this._dirty = true;
        this.updateObject();
    }

    translate(x, y, z) {
        this.position.add(new Vector3(x, y, z));
        this._dirty = true;
        this.updateObject();
    }

    // Rotation methods
    setRotation(x, y, z) {
        this.rotation.set(x, y, z);
        this.quaternion.setFromEuler(this.rotation);
        this._dirty = true;
        this.updateObject();
    }

    rotate(x, y, z) {
        this.rotation.x += x;
        this.rotation.y += y;
        this.rotation.z += z;
        this.quaternion.setFromEuler(this.rotation);
        this._dirty = true;
        this.updateObject();
    }

    setQuaternion(x, y, z, w) {
        this.quaternion.set(x, y, z, w);
        this.rotation.setFromQuaternion(this.quaternion);
        this._dirty = true;
        this.updateObject();
    }

    // Scale methods
    setScale(x, y, z) {
        this.scale.set(x, y, z);
        this._dirty = true;
        this.updateObject();
    }

    // Matrix operations
    updateMatrix() {
        this.matrix.compose(this.position, this.quaternion, this.scale);
        this._dirty = false;
    }

    updateWorldMatrix() {
        if (this._dirty) {
            this.updateMatrix();
        }

        if (this._parent) {
            this.worldMatrix.multiplyMatrices(this._parent.worldMatrix, this.matrix);
        } else {
            this.worldMatrix.copy(this.matrix);
        }

        // Update children
        for (const child of this._children) {
            child.updateWorldMatrix();
        }
    }

    // Hierarchy methods
    setParent(parent) {
        if (this._parent) {
            this._parent._children.delete(this);
        }

        this._parent = parent;

        if (parent) {
            parent._children.add(this);
        }

        this.updateWorldMatrix();
    }

    addChild(child) {
        child.setParent(this);
    }

    removeChild(child) {
        child.setParent(null);
    }

    // Update object's transform
    updateObject() {
        if (this.object) {
            this.object.position.copy(this.position);
            this.object.rotation.copy(this.rotation);
            this.object.scale.copy(this.scale);
            this.object.quaternion.copy(this.quaternion);
            this.object.updateMatrix();
            this.object.updateMatrixWorld();
        }
    }

    // Serialization
    toJSON() {
        const json = super.toJSON();
        json.position = this.position.toArray();
        json.rotation = [this.rotation.x, this.rotation.y, this.rotation.z];
        json.scale = this.scale.toArray();
        json.quaternion = this.quaternion.toArray();
        return json;
    }

    fromJSON(json) {
        super.fromJSON(json);
        this.position.fromArray(json.position);
        this.rotation.set(...json.rotation);
        this.scale.fromArray(json.scale);
        this.quaternion.fromArray(json.quaternion);
        this._dirty = true;
        return this;
    }
} 