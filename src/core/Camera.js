class Camera {
    constructor(position = glMatrix.vec3.fromValues(0, 0, 3), yaw = -90, pitch = 0) {
        this.position = position;
        this.worldUp = glMatrix.vec3.fromValues(0, 1, 0);
        this.yaw = yaw;
        this.pitch = pitch;

        this.front = glMatrix.vec3.create();
        this.right = glMatrix.vec3.create();
        this.up = glMatrix.vec3.create();

        this.viewMatrix = glMatrix.mat4.create();
        this.projectionMatrix = glMatrix.mat4.create();

        this.updateCameraVectors();
    }

    getViewMatrix() {
        glMatrix.mat4.lookAt(
            this.viewMatrix,
            this.position,
            glMatrix.vec3.add(glMatrix.vec3.create(), this.position, this.front),
            this.up
        );
        return this.viewMatrix;
    }

    setPerspective(fov, aspect, near, far) {
        glMatrix.mat4.perspective(this.projectionMatrix, fov, aspect, near, far);
    }

    getProjectionMatrix() {
        return this.projectionMatrix;
    }

    setPosition(position) {
        this.position = position;
    }

    getPosition() {
        return this.position;
    }

    setRotation(yaw, pitch) {
        this.yaw = yaw;
        this.pitch = Math.max(-89.0, Math.min(89.0, pitch));
        this.updateCameraVectors();
    }

    updateCameraVectors() {
        // Calculate new front vector
        const front = glMatrix.vec3.create();
        front[0] = Math.cos(this.yaw * Math.PI / 180) * Math.cos(this.pitch * Math.PI / 180);
        front[1] = Math.sin(this.pitch * Math.PI / 180);
        front[2] = Math.sin(this.yaw * Math.PI / 180) * Math.cos(this.pitch * Math.PI / 180);
        glMatrix.vec3.normalize(this.front, front);

        // Re-calculate right and up vectors
        glMatrix.vec3.cross(this.right, this.front, this.worldUp);
        glMatrix.vec3.normalize(this.right, this.right);
        glMatrix.vec3.cross(this.up, this.right, this.front);
        glMatrix.vec3.normalize(this.up, this.up);
    }

    moveForward(distance) {
        glMatrix.vec3.scaleAndAdd(this.position, this.position, this.front, distance);
    }

    moveRight(distance) {
        glMatrix.vec3.scaleAndAdd(this.position, this.position, this.right, distance);
    }

    moveUp(distance) {
        glMatrix.vec3.scaleAndAdd(this.position, this.position, this.up, distance);
    }
} 