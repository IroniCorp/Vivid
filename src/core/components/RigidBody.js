import { Vector3, Box3 } from 'three';
import { Component } from '../Component';

export class RigidBody extends Component {
    constructor(options = {}) {
        super();

        this.mass = options.mass || 1;
        this.type = options.type || 'dynamic'; // dynamic, static, kinematic
        this.shape = options.shape || 'box';
        this.isTrigger = options.isTrigger || false;

        // Physics properties
        this.friction = options.friction || 0.3;
        this.restitution = options.restitution || 0.3;
        this.linearDamping = options.linearDamping || 0.01;
        this.angularDamping = options.angularDamping || 0.01;

        // Internal properties
        this._body = null;
        this._physics = null;
        this._size = new Vector3(1, 1, 1);
    }

    onAttach(object) {
        super.onAttach(object);

        // Get physics system from scene
        this._physics = this.object.parent?.physicsSystem;
        if (!this._physics) {
            console.warn('No physics system found in scene');
            return;
        }

        // Calculate size from geometry if available
        const mesh = this.object.getComponent?.('Mesh')?.getMesh();
        if (mesh?.geometry) {
            const boundingBox = new Box3().setFromObject(mesh);
            boundingBox.getSize(this._size);
        }

        // Create rigid body
        this._body = this._physics.addRigidBody(this.object, {
            mass: this.type === 'static' ? 0 : this.mass,
            shape: this.shape,
            size: this._size,
            isTrigger: this.isTrigger,
            material: {
                friction: this.friction,
                restitution: this.restitution
            }
        });

        // Set additional properties
        this._body.linearDamping = this.linearDamping;
        this._body.angularDamping = this.angularDamping;

        // Set type
        if (this.type === 'kinematic') {
            this._body.type = 4; // CANNON.Body.KINEMATIC
        }
    }

    onDetach() {
        if (this._physics && this._body) {
            this._physics.removeRigidBody(this._body);
            this._body = null;
        }
        super.onDetach();
    }

    // Force application
    applyForce(force, worldPoint = null) {
        if (this._body) {
            this._physics.applyForce(this._body, force, worldPoint);
        }
    }

    applyImpulse(impulse, worldPoint = null) {
        if (this._body) {
            this._physics.applyImpulse(this._body, impulse, worldPoint);
        }
    }

    // Velocity
    setLinearVelocity(velocity) {
        if (this._body) {
            this._body.velocity.copy(this._physics._threeVectorToCannon(velocity));
        }
    }

    getLinearVelocity() {
        if (this._body) {
            return this._physics._cannonVectorToThree(this._body.velocity);
        }
        return new Vector3();
    }

    setAngularVelocity(velocity) {
        if (this._body) {
            this._body.angularVelocity.copy(this._physics._threeVectorToCannon(velocity));
        }
    }

    getAngularVelocity() {
        if (this._body) {
            return this._physics._cannonVectorToThree(this._body.angularVelocity);
        }
        return new Vector3();
    }

    // Constraints
    addConstraint(otherBody, options) {
        if (this._physics && this._body && otherBody._body) {
            return this._physics.createConstraint(this._body, otherBody._body, options);
        }
        return null;
    }

    removeConstraint(constraint) {
        if (this._physics) {
            this._physics.removeConstraint(constraint);
        }
    }

    // Collision detection
    setCollisionCallback(callback) {
        if (this._body) {
            this._body.addEventListener('collide', (event) => {
                const otherBody = event.body;
                const otherObject = this._physics._bodyMaterialMap.get(otherBody);
                if (otherObject) {
                    callback(otherObject, event.contact);
                }
            });
        }
    }

    // Physics properties
    setMass(mass) {
        this.mass = mass;
        if (this._body && this.type !== 'static') {
            this._body.mass = mass;
            this._body.updateMassProperties();
        }
    }

    setFriction(friction) {
        this.friction = friction;
        if (this._body) {
            this._body.material.friction = friction;
        }
    }

    setRestitution(restitution) {
        this.restitution = restitution;
        if (this._body) {
            this._body.material.restitution = restitution;
        }
    }

    setLinearDamping(damping) {
        this.linearDamping = damping;
        if (this._body) {
            this._body.linearDamping = damping;
        }
    }

    setAngularDamping(damping) {
        this.angularDamping = damping;
        if (this._body) {
            this._body.angularDamping = damping;
        }
    }

    // Kinematic control
    movePosition(position) {
        if (this._body && this.type === 'kinematic') {
            this._body.position.copy(this._physics._threeVectorToCannon(position));
            this.object.position.copy(position);
        }
    }

    moveRotation(rotation) {
        if (this._body && this.type === 'kinematic') {
            this._body.quaternion.copy(this._physics._threeQuaternionToCannon(rotation));
            this.object.quaternion.copy(rotation);
        }
    }

    // Utility
    isActive() {
        return this._body?.isActive() || false;
    }

    wakeUp() {
        if (this._body) {
            this._body.wakeUp();
        }
    }

    sleep() {
        if (this._body) {
            this._body.sleep();
        }
    }

    // Serialization
    toJSON() {
        const json = super.toJSON();
        json.mass = this.mass;
        json.type = this.type;
        json.shape = this.shape;
        json.isTrigger = this.isTrigger;
        json.friction = this.friction;
        json.restitution = this.restitution;
        json.linearDamping = this.linearDamping;
        json.angularDamping = this.angularDamping;
        return json;
    }

    fromJSON(json) {
        super.fromJSON(json);
        this.mass = json.mass;
        this.type = json.type;
        this.shape = json.shape;
        this.isTrigger = json.isTrigger;
        this.friction = json.friction;
        this.restitution = json.restitution;
        this.linearDamping = json.linearDamping;
        this.angularDamping = json.angularDamping;
 