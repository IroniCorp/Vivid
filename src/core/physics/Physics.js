import * as CANNON from 'cannon-es';
import { Vector3, Quaternion } from 'three';

export class Physics {
    constructor(options = {}) {
        // Create physics world
        this.world = new CANNON.World();
        this.world.gravity.set(0, options.gravity || -9.82, 0);
        
        // Broadphase algorithm
        this.world.broadphase = new CANNON.SAPBroadphase(this.world);
        
        // Solver settings
        this.world.solver.iterations = options.solverIterations || 10;
        this.world.solver.tolerance = options.solverTolerance || 0.1;

        // Body-material map
        this._bodyMaterialMap = new WeakMap();

        // Default material
        this.defaultMaterial = new CANNON.Material('default');
        this.defaultContactMaterial = new CANNON.ContactMaterial(
            this.defaultMaterial,
            this.defaultMaterial,
            {
                friction: 0.3,
                restitution: 0.3
            }
        );
        this.world.addContactMaterial(this.defaultContactMaterial);

        // Debug settings
        this.debug = options.debug || false;
    }

    // Update physics world
    update(deltaTime) {
        this.world.step(1/60, deltaTime, 3);

        // Update all registered bodies
        this.world.bodies.forEach(body => {
            const object = this._bodyMaterialMap.get(body);
            if (object) {
                // Update position
                object.position.copy(this._cannonVectorToThree(body.position));
                
                // Update rotation
                object.quaternion.copy(this._cannonQuaternionToThree(body.quaternion));
            }
        });
    }

    // Add rigid body
    addRigidBody(object, options = {}) {
        const shape = this._createShape(options.shape || 'box', options);
        
        // Create body
        const body = new CANNON.Body({
            mass: options.mass || 0,
            position: this._threeVectorToCannon(object.position),
            quaternion: this._threeQuaternionToCannon(object.quaternion),
            material: this.defaultMaterial,
            type: options.mass === 0 ? CANNON.Body.STATIC : CANNON.Body.DYNAMIC
        });

        // Add shape to body
        body.addShape(shape);

        // Add body to world
        this.world.addBody(body);

        // Map body to object
        this._bodyMaterialMap.set(body, object);

        return body;
    }

    // Remove rigid body
    removeRigidBody(body) {
        this.world.removeBody(body);
        this._bodyMaterialMap.delete(body);
    }

    // Create physics shape
    _createShape(type, options = {}) {
        switch (type) {
            case 'box':
                return new CANNON.Box(new CANNON.Vec3(
                    options.size?.x || 0.5,
                    options.size?.y || 0.5,
                    options.size?.z || 0.5
                ));
            case 'sphere':
                return new CANNON.Sphere(options.radius || 0.5);
            case 'cylinder':
                return new CANNON.Cylinder(
                    options.radiusTop || 0.5,
                    options.radiusBottom || 0.5,
                    options.height || 1,
                    options.segments || 8
                );
            case 'plane':
                return new CANNON.Plane();
            default:
                console.warn(`Unknown physics shape type: ${type}, defaulting to box`);
                return new CANNON.Box(new CANNON.Vec3(0.5, 0.5, 0.5));
        }
    }

    // Create constraint
    createConstraint(bodyA, bodyB, options = {}) {
        let constraint;

        switch (options.type) {
            case 'point':
                constraint = new CANNON.PointToPointConstraint(
                    bodyA,
                    options.pivotA || new CANNON.Vec3(),
                    bodyB,
                    options.pivotB || new CANNON.Vec3(),
                    options.maxForce || undefined
                );
                break;
            case 'hinge':
                constraint = new CANNON.HingeConstraint(
                    bodyA,
                    bodyB,
                    {
                        pivotA: options.pivotA || new CANNON.Vec3(),
                        pivotB: options.pivotB || new CANNON.Vec3(),
                        axisA: options.axisA || new CANNON.Vec3(1, 0, 0),
                        axisB: options.axisB || new CANNON.Vec3(1, 0, 0),
                        maxForce: options.maxForce || undefined
                    }
                );
                break;
            case 'distance':
                constraint = new CANNON.DistanceConstraint(
                    bodyA,
                    bodyB,
                    options.distance || undefined,
                    options.maxForce || undefined
                );
                break;
            default:
                console.warn(`Unknown constraint type: ${options.type}, defaulting to point`);
                constraint = new CANNON.PointToPointConstraint(
                    bodyA,
                    new CANNON.Vec3(),
                    bodyB,
                    new CANNON.Vec3()
                );
        }

        this.world.addConstraint(constraint);
        return constraint;
    }

    // Remove constraint
    removeConstraint(constraint) {
        this.world.removeConstraint(constraint);
    }

    // Apply force to body
    applyForce(body, force, worldPoint) {
        const cannonForce = this._threeVectorToCannon(force);
        const cannonPoint = worldPoint ? this._threeVectorToCannon(worldPoint) : body.position;
        body.applyForce(cannonForce, cannonPoint);
    }

    // Apply impulse to body
    applyImpulse(body, impulse, worldPoint) {
        const cannonImpulse = this._threeVectorToCannon(impulse);
        const cannonPoint = worldPoint ? this._threeVectorToCannon(worldPoint) : body.position;
        body.applyImpulse(cannonImpulse, cannonPoint);
    }

    // Conversion utilities
    _threeVectorToCannon(vector) {
        return new CANNON.Vec3(vector.x, vector.y, vector.z);
    }

    _cannonVectorToThree(vector) {
        return new Vector3(vector.x, vector.y, vector.z);
    }

    _threeQuaternionToCannon(quaternion) {
        return new CANNON.Quaternion(quaternion.x, quaternion.y, quaternion.z, quaternion.w);
    }

    _cannonQuaternionToThree(quaternion) {
        return new Quaternion(quaternion.x, quaternion.y, quaternion.z, quaternion.w);
    }

    // Ray casting
    raycast(from, to) {
        const rayFrom = this._threeVectorToCannon(from);
        const rayTo = this._threeVectorToCannon(to);
        
        const result = new CANNON.RaycastResult();
        this.world.raycastClosest(rayFrom, rayTo, {}, result);
        
        return result.hasHit ? {
            body: result.body,
            point: this._cannonVectorToThree(result.hitPointWorld),
            normal: this._cannonVectorToThree(result.hitNormalWorld),
            distance: result.distance
        } : null;
    }

    // Debug visualization
    setDebug(enabled) {
        this.debug = enabled;
    }

    dispose() {
        this.world.bodies.forEach(body => {
            this.world.removeBody(body);
        });
        this._bodyMaterialMap = new WeakMap();
    }
} 