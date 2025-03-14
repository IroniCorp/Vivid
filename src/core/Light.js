class Light {
    constructor(options = {}) {
        this.type = options.type || 'point';
        this.position = options.position || [0, 0, 0];
        this.direction = options.direction || [0, -1, 0];
        this.color = options.color || [1, 1, 1];
        this.intensity = options.intensity || 1.0;
        
        // Point light properties
        this.constant = options.constant || 1.0;
        this.linear = options.linear || 0.09;
        this.quadratic = options.quadratic || 0.032;
        
        // Spot light properties
        this.cutOff = options.cutOff || Math.cos(Math.PI / 6);        // 30 degrees
        this.outerCutOff = options.outerCutOff || Math.cos(Math.PI / 4); // 45 degrees
        
        // Shadow properties
        this.castShadow = options.castShadow || false;
        this.shadowBias = options.shadowBias || 0.005;
        this.shadowMapSize = options.shadowMapSize || 1024;
        this.shadowNear = options.shadowNear || 0.1;
        this.shadowFar = options.shadowFar || 100.0;
        
        // For directional and spot lights
        if (this.type !== 'point') {
            glMatrix.vec3.normalize(this.direction, this.direction);
        }
    }

    setupUniforms(shader, index) {
        const prefix = `uLights[${index}]`;
        
        shader.setUniform1i(`${prefix}.type`, this.getLightTypeValue());
        shader.setUniform3f(`${prefix}.position`, ...this.position);
        shader.setUniform3f(`${prefix}.direction`, ...this.direction);
        shader.setUniform3f(`${prefix}.color`, ...this.color);
        shader.setUniform1f(`${prefix}.intensity`, this.intensity);
        
        // Point light attenuation
        if (this.type === 'point') {
            shader.setUniform1f(`${prefix}.constant`, this.constant);
            shader.setUniform1f(`${prefix}.linear`, this.linear);
            shader.setUniform1f(`${prefix}.quadratic`, this.quadratic);
        }
        
        // Spot light properties
        if (this.type === 'spot') {
            shader.setUniform1f(`${prefix}.cutOff`, this.cutOff);
            shader.setUniform1f(`${prefix}.outerCutOff`, this.outerCutOff);
        }
        
        // Shadow properties
        shader.setUniform1i(`${prefix}.castShadow`, this.castShadow ? 1 : 0);
        if (this.castShadow) {
            shader.setUniform1f(`${prefix}.shadowBias`, this.shadowBias);
            // Additional shadow uniforms will be set when implementing shadow mapping
        }
    }

    getLightTypeValue() {
        switch (this.type) {
            case 'directional': return 0;
            case 'point': return 1;
            case 'spot': return 2;
            default: return 1; // Default to point light
        }
    }

    // Methods for shadow mapping (to be implemented)
    setupShadowMap(gl) {
        if (!this.castShadow) return;

        // Create framebuffer
        this.shadowFramebuffer = gl.createFramebuffer();
        gl.bindFramebuffer(gl.FRAMEBUFFER, this.shadowFramebuffer);

        // Create texture
        this.shadowMap = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, this.shadowMap);
        gl.texImage2D(
            gl.TEXTURE_2D,
            0,
            gl.DEPTH_COMPONENT24,
            this.shadowMapSize,
            this.shadowMapSize,
            0,
            gl.DEPTH_COMPONENT,
            gl.UNSIGNED_INT,
            null
        );
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

        // Attach texture to framebuffer
        gl.framebufferTexture2D(
            gl.FRAMEBUFFER,
            gl.DEPTH_ATTACHMENT,
            gl.TEXTURE_2D,
            this.shadowMap,
            0
        );

        // No color buffer needed for shadow mapping
        gl.drawBuffers([gl.NONE]);
        gl.readBuffer(gl.NONE);

        if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) !== gl.FRAMEBUFFER_COMPLETE) {
            console.error('Framebuffer is not complete!');
        }

        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    }

    getLightSpaceMatrix() {
        const lightProjection = glMatrix.mat4.create();
        const lightView = glMatrix.mat4.create();
        const lightSpaceMatrix = glMatrix.mat4.create();

        if (this.type === 'directional') {
            // Orthographic projection for directional lights
            glMatrix.mat4.ortho(lightProjection, -10, 10, -10, 10, this.shadowNear, this.shadowFar);
        } else {
            // Perspective projection for point and spot lights
            glMatrix.mat4.perspective(lightProjection, Math.PI / 2, 1, this.shadowNear, this.shadowFar);
        }

        glMatrix.mat4.lookAt(
            lightView,
            this.position,
            glMatrix.vec3.add([], this.position, this.direction),
            [0, 1, 0]
        );

        glMatrix.mat4.multiply(lightSpaceMatrix, lightProjection, lightView);
        return lightSpaceMatrix;
    }

    bindShadowMap(gl, unit) {
        if (!this.shadowMap) return;
        
        gl.activeTexture(gl.TEXTURE0 + unit);
        gl.bindTexture(gl.TEXTURE_2D, this.shadowMap);
        return unit;
    }

    dispose(gl) {
        if (this.shadowMap) {
            gl.deleteTexture(this.shadowMap);
        }
        if (this.shadowFramebuffer) {
            gl.deleteFramebuffer(this.shadowFramebuffer);
        }
    }
} 