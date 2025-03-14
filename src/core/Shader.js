class Shader {
    constructor(gl, vertexSource, fragmentSource) {
        this.gl = gl;
        const program = this.createShaderProgram(vertexSource, fragmentSource);
        if (!program) {
            throw new Error('Failed to create shader program');
        }
        this.program = program;
    }

    createShader(type, source) {
        const shader = this.gl.createShader(type);
        if (!shader) {
            console.error('Failed to create shader');
            return null;
        }

        this.gl.shaderSource(shader, source);
        this.gl.compileShader(shader);

        if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
            console.error('Shader compilation error:', this.gl.getShaderInfoLog(shader));
            this.gl.deleteShader(shader);
            return null;
        }

        return shader;
    }

    createShaderProgram(vertexSource, fragmentSource) {
        const vertexShader = this.createShader(this.gl.VERTEX_SHADER, vertexSource);
        const fragmentShader = this.createShader(this.gl.FRAGMENT_SHADER, fragmentSource);

        if (!vertexShader || !fragmentShader) {
            return null;
        }

        const program = this.gl.createProgram();
        if (!program) {
            return null;
        }

        this.gl.attachShader(program, vertexShader);
        this.gl.attachShader(program, fragmentShader);
        this.gl.linkProgram(program);

        if (!this.gl.getProgramParameter(program, this.gl.LINK_STATUS)) {
            console.error('Program linking error:', this.gl.getProgramInfoLog(program));
            this.gl.deleteProgram(program);
            return null;
        }

        // Clean up shaders after linking
        this.gl.deleteShader(vertexShader);
        this.gl.deleteShader(fragmentShader);

        return program;
    }

    use() {
        this.gl.useProgram(this.program);
    }

    getUniformLocation(name) {
        return this.gl.getUniformLocation(this.program, name);
    }

    getAttribLocation(name) {
        return this.gl.getAttribLocation(this.program, name);
    }

    setUniform1f(name, value) {
        const location = this.getUniformLocation(name);
        if (location) {
            this.gl.uniform1f(location, value);
        }
    }

    setUniform3f(name, x, y, z) {
        const location = this.getUniformLocation(name);
        if (location) {
            this.gl.uniform3f(location, x, y, z);
        }
    }

    setUniformMatrix4fv(name, value) {
        const location = this.getUniformLocation(name);
        if (location) {
            this.gl.uniformMatrix4fv(location, false, value);
        }
    }

    dispose() {
        this.gl.deleteProgram(this.program);
    }
} 