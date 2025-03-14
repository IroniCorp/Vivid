class Particle {
    constructor(position, velocity, life = 1.0, size = 1.0, color = [1, 1, 1, 1]) {
        this.position = position;
        this.velocity = velocity;
        this.acceleration = [0, -9.81, 0]; // Default gravity
        this.life = life;
        this.maxLife = life;
        this.size = size;
        this.color = color;
        this.active = true;
    }

    update(deltaTime) {
        if (!this.active) return;

        // Update life
        this.life -= deltaTime;
        if (this.life <= 0) {
            this.active = false;
            return;
        }

        // Update velocity
        this.velocity[0] += this.acceleration[0] * deltaTime;
        this.velocity[1] += this.acceleration[1] * deltaTime;
        this.velocity[2] += this.acceleration[2] * deltaTime;

        // Update position
        this.position[0] += this.velocity[0] * deltaTime;
        this.position[1] += this.velocity[1] * deltaTime;
        this.position[2] += this.velocity[2] * deltaTime;

        // Update color alpha based on life
        this.color[3] = this.life / this.maxLife;
    }
}

class ParticleSystem {
    constructor(gl, maxParticles = 1000) {
        this.gl = gl;
        this.maxParticles = maxParticles;
        this.particles = [];
        this.emissionRate = 10; // Particles per second
        this.emissionAccumulator = 0;
        
        this.position = [0, 0, 0];
        this.direction = [0, 1, 0];
        this.spread = Math.PI / 4; // 45 degrees
        this.minLife = 1.0;
        this.maxLife = 3.0;
        this.minSize = 0.1;
        this.maxSize = 0.5;
        this.minSpeed = 1.0;
        this.maxSpeed = 3.0;

        this.setupBuffers();
        this.setupShader();
    }

    setupBuffers() {
        const { gl } = this;

        // Create buffers for instanced rendering
        this.positionBuffer = gl.createBuffer();
        this.sizeBuffer = gl.createBuffer();
        this.colorBuffer = gl.createBuffer();

        // Create quad vertices for particles
        const vertices = new Float32Array([
            -0.5, -0.5,
             0.5, -0.5,
             0.5,  0.5,
            -0.5,  0.5
        ]);

        const indices = new Uint16Array([
            0, 1, 2,
            0, 2, 3
        ]);

        // Create and bind VAO
        this.vao = gl.createVertexArray();
        gl.bindVertexArray(this.vao);

        // Quad vertices
        const quadBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, quadBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
        gl.enableVertexAttribArray(0);
        gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

        // Instance attributes
        gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);
        gl.enableVertexAttribArray(1);
        gl.vertexAttribPointer(1, 3, gl.FLOAT, false, 0, 0);
        gl.vertexAttribDivisor(1, 1);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.sizeBuffer);
        gl.enableVertexAttribArray(2);
        gl.vertexAttribPointer(2, 1, gl.FLOAT, false, 0, 0);
        gl.vertexAttribDivisor(2, 1);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.colorBuffer);
        gl.enableVertexAttribArray(3);
        gl.vertexAttribPointer(3, 4, gl.FLOAT, false, 0, 0);
        gl.vertexAttribDivisor(3, 1);

        // Element buffer
        const ebo = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ebo);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);

        gl.bindVertexArray(null);
    }

    setupShader() {
        const vertexShader = `#version 300 es
        layout(location = 0) in vec2 aQuadPosition;
        layout(location = 1) in vec3 aPosition;
        layout(location = 2) in float aSize;
        layout(location = 3) in vec4 aColor;

        uniform mat4 uViewProjection;
        uniform vec3 uCameraRight;
        uniform vec3 uCameraUp;

        out vec4 vColor;

        void main() {
            vec3 vertexPosition = aPosition + (uCameraRight * aQuadPosition.x + uCameraUp * aQuadPosition.y) * aSize;
            gl_Position = uViewProjection * vec4(vertexPosition, 1.0);
            vColor = aColor;
        }`;

        const fragmentShader = `#version 300 es
        precision highp float;
        in vec4 vColor;
        out vec4 fragColor;

        void main() {
            fragColor = vColor;
        }`;

        this.shader = new Shader(this.gl, vertexShader, fragmentShader);
    }

    emit(deltaTime) {
        this.emissionAccumulator += deltaTime * this.emissionRate;
        const particlesToEmit = Math.floor(this.emissionAccumulator);
        this.emissionAccumulator -= particlesToEmit;

        for (let i = 0; i < particlesToEmit; i++) {
            if (this.particles.length >= this.maxParticles) break;

            // Generate random direction within spread cone
            const phi = Math.random() * 2 * Math.PI;
            const theta = Math.random() * this.spread;
            const x = Math.sin(theta) * Math.cos(phi);
            const y = Math.cos(theta);
            const z = Math.sin(theta) * Math.sin(phi);

            // Generate random properties
            const life = this.minLife + Math.random() * (this.maxLife - this.minLife);
            const size = this.minSize + Math.random() * (this.maxSize - this.minSize);
            const speed = this.minSpeed + Math.random() * (this.maxSpeed - this.minSpeed);

            const position = [...this.position];
            const velocity = [x * speed, y * speed, z * speed];

            this.particles.push(new Particle(position, velocity, life, size));
        }
    }

    update(deltaTime) {
        // Emit new particles
        this.emit(deltaTime);

        // Update existing particles
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const particle = this.particles[i];
            particle.update(deltaTime);

            if (!particle.active) {
                this.particles.splice(i, 1);
            }
        }

        // Update buffers
        const positions = new Float32Array(this.particles.length * 3);
        const sizes = new Float32Array(this.particles.length);
        const colors = new Float32Array(this.particles.length * 4);

        for (let i = 0; i < this.particles.length; i++) {
            const particle = this.particles[i];
            positions.set(particle.position, i * 3);
            sizes[i] = particle.size;
            colors.set(particle.color, i * 4);
        }

        const { gl } = this;
        gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, positions, gl.DYNAMIC_DRAW);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.sizeBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, sizes, gl.DYNAMIC_DRAW);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.colorBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, colors, gl.DYNAMIC_DRAW);
    }

    render(camera) {
        if (this.particles.length === 0) return;

        const { gl } = this;
        
        // Enable blending for transparency
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

        this.shader.use();
        this.shader.setUniformMatrix4fv('uViewProjection', camera.getViewProjectionMatrix());

        // Calculate camera-aligned basis vectors
        const cameraRight = [
            camera.viewMatrix[0],
            camera.viewMatrix[4],
            camera.viewMatrix[8]
        ];
        const cameraUp = [
            camera.viewMatrix[1],
            camera.viewMatrix[5],
            camera.viewMatrix[9]
        ];

        this.shader.setUniform3f('uCameraRight', ...cameraRight);
        this.shader.setUniform3f('uCameraUp', ...cameraUp);

        gl.bindVertexArray(this.vao);
        gl.drawElementsInstanced(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0, this.particles.length);
        gl.bindVertexArray(null);

        gl.disable(gl.BLEND);
    }

    dispose() {
        const { gl } = this;
        gl.deleteBuffer(this.positionBuffer);
        gl.deleteBuffer(this.sizeBuffer);
        gl.deleteBuffer(this.colorBuffer);
        gl.deleteVertexArray(this.vao);
        this.shader.dispose();
    }
} 