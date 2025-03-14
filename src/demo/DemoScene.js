class DemoScene {
    constructor(canvas) {
        this.engine = new Engine({ canvas });
        this.camera = new Camera(glMatrix.vec3.fromValues(0, 0, 5));
        
        // Create shader program
        const vertexShaderSource = document.getElementById('vertexShader').textContent;
        const fragmentShaderSource = document.getElementById('fragmentShader').textContent;
        this.shader = new Shader(this.engine.context, vertexShaderSource, fragmentShaderSource);
        
        // Create cube mesh
        const cubeData = this.createCubeData();
        this.cube = new Mesh(this.engine.context, cubeData);

        // Initialize matrices and vectors
        this.modelMatrix = glMatrix.mat4.create();
        this.lightPos = glMatrix.vec3.fromValues(2.0, 2.0, 2.0);
        this.lightColor = glMatrix.vec3.fromValues(1.0, 1.0, 1.0);
        this.objectColor = glMatrix.vec3.fromValues(1.0, 0.5, 0.31);

        // Set up camera projection
        this.camera.setPerspective(45 * Math.PI / 180, canvas.width / canvas.height, 0.1, 100.0);

        // Start the render loop
        this.engine.start();
        this.render = this.render.bind(this);
        requestAnimationFrame(this.render);

        // Set up event listeners for camera control
        this.setupControls();
    }

    createCubeData() {
        return {
            vertices: [
                // Front face
                -0.5, -0.5,  0.5,
                 0.5, -0.5,  0.5,
                 0.5,  0.5,  0.5,
                -0.5,  0.5,  0.5,
                // Back face
                -0.5, -0.5, -0.5,
                -0.5,  0.5, -0.5,
                 0.5,  0.5, -0.5,
                 0.5, -0.5, -0.5,
            ],
            normals: [
                // Front
                0.0,  0.0,  1.0,
                0.0,  0.0,  1.0,
                0.0,  0.0,  1.0,
                0.0,  0.0,  1.0,
                // Back
                0.0,  0.0, -1.0,
                0.0,  0.0, -1.0,
                0.0,  0.0, -1.0,
                0.0,  0.0, -1.0,
            ],
            indices: [
                0, 1, 2,    0, 2, 3,  // Front
                4, 5, 6,    4, 6, 7,  // Back
                5, 3, 2,    5, 2, 6,  // Top
                4, 7, 1,    4, 1, 0,  // Bottom
                7, 6, 2,    7, 2, 1,  // Right
                4, 0, 3,    4, 3, 5   // Left
            ]
        };
    }

    setupControls() {
        let isMouseDown = false;
        let lastX = 0;
        let lastY = 0;
        
        document.addEventListener('mousedown', (e) => {
            isMouseDown = true;
            lastX = e.clientX;
            lastY = e.clientY;
        });

        document.addEventListener('mouseup', () => {
            isMouseDown = false;
        });

        document.addEventListener('mousemove', (e) => {
            if (!isMouseDown) return;

            const deltaX = e.clientX - lastX;
            const deltaY = e.clientY - lastY;
            lastX = e.clientX;
            lastY = e.clientY;

            const sensitivity = 0.1;
            this.camera.setRotation(
                this.camera.yaw + deltaX * sensitivity,
                this.camera.pitch - deltaY * sensitivity
            );
        });

        document.addEventListener('keydown', (e) => {
            const speed = 0.1;
            switch (e.key.toLowerCase()) {
                case 'w':
                    this.camera.moveForward(speed);
                    break;
                case 's':
                    this.camera.moveForward(-speed);
                    break;
                case 'a':
                    this.camera.moveRight(-speed);
                    break;
                case 'd':
                    this.camera.moveRight(speed);
                    break;
                case 'q':
                    this.camera.moveUp(speed);
                    break;
                case 'e':
                    this.camera.moveUp(-speed);
                    break;
            }
        });
    }

    render(time) {
        // Rotate the cube
        glMatrix.mat4.identity(this.modelMatrix);
        glMatrix.mat4.rotateY(this.modelMatrix, this.modelMatrix, time * 0.001);
        glMatrix.mat4.rotateX(this.modelMatrix, this.modelMatrix, time * 0.0005);

        // Use shader and set uniforms
        this.shader.use();
        this.shader.setUniformMatrix4fv('uProjection', this.camera.getProjectionMatrix());
        this.shader.setUniformMatrix4fv('uView', this.camera.getViewMatrix());
        this.shader.setUniformMatrix4fv('uModel', this.modelMatrix);
        
        this.shader.setUniform3f('uLightPos', this.lightPos[0], this.lightPos[1], this.lightPos[2]);
        this.shader.setUniform3f('uViewPos', ...this.camera.getPosition());
        this.shader.setUniform3f('uLightColor', this.lightColor[0], this.lightColor[1], this.lightColor[2]);
        this.shader.setUniform3f('uObjectColor', this.objectColor[0], this.objectColor[1], this.objectColor[2]);

        // Render the cube
        this.cube.render(this.shader, this.modelMatrix);

        requestAnimationFrame(this.render);
    }

    dispose() {
        this.cube.dispose();
        this.shader.dispose();
    }
} 