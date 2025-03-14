class Effect {
    constructor(gl, vertexShader, fragmentShader) {
        this.gl = gl;
        this.shader = new Shader(gl, vertexShader, fragmentShader);
        this.setupFramebuffer();
    }

    setupFramebuffer() {
        const { gl } = this;
        
        this.framebuffer = gl.createFramebuffer();
        gl.bindFramebuffer(gl.FRAMEBUFFER, this.framebuffer);

        this.texture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, this.texture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA16F, gl.canvas.width, gl.canvas.height, 0, gl.RGBA, gl.FLOAT, null);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.texture, 0);

        if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) !== gl.FRAMEBUFFER_COMPLETE) {
            console.error('Framebuffer is not complete!');
        }

        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    }

    resize(width, height) {
        const { gl } = this;
        gl.bindTexture(gl.TEXTURE_2D, this.texture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA16F, width, height, 0, gl.RGBA, gl.FLOAT, null);
    }

    apply(gl, inputTexture, quadVAO) {
        gl.bindFramebuffer(gl.FRAMEBUFFER, this.framebuffer);
        gl.clear(gl.COLOR_BUFFER_BIT);

        this.shader.use();
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, inputTexture);
        this.shader.setUniform1i('uTexture', 0);

        this.setUniforms();

        gl.bindVertexArray(quadVAO);
        gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);
        gl.bindVertexArray(null);

        return this.texture;
    }

    setUniforms() {
        // Override in subclasses to set effect-specific uniforms
    }

    dispose() {
        const { gl } = this;
        gl.deleteFramebuffer(this.framebuffer);
        gl.deleteTexture(this.texture);
        this.shader.dispose();
    }
}

// Bloom Effect
class BloomEffect extends Effect {
    constructor(gl, threshold = 1.0, intensity = 1.0) {
        const vertexShader = `#version 300 es
        layout(location = 0) in vec2 aPosition;
        layout(location = 1) in vec2 aTexCoord;
        out vec2 vTexCoord;
        void main() {
            vTexCoord = aTexCoord;
            gl_Position = vec4(aPosition, 0.0, 1.0);
        }`;

        const fragmentShader = `#version 300 es
        precision highp float;
        uniform sampler2D uTexture;
        uniform float uThreshold;
        uniform float uIntensity;
        in vec2 vTexCoord;
        out vec4 fragColor;

        void main() {
            vec4 color = texture(uTexture, vTexCoord);
            float brightness = dot(color.rgb, vec3(0.2126, 0.7152, 0.0722));
            if(brightness > uThreshold) {
                fragColor = color * uIntensity;
            } else {
                fragColor = vec4(0.0);
            }
        }`;

        super(gl, vertexShader, fragmentShader);
        this.threshold = threshold;
        this.intensity = intensity;
    }

    setUniforms() {
        this.shader.setUniform1f('uThreshold', this.threshold);
        this.shader.setUniform1f('uIntensity', this.intensity);
    }
}

// FXAA Anti-aliasing Effect
class FXAAEffect extends Effect {
    constructor(gl) {
        const vertexShader = `#version 300 es
        layout(location = 0) in vec2 aPosition;
        layout(location = 1) in vec2 aTexCoord;
        out vec2 vTexCoord;
        void main() {
            vTexCoord = aTexCoord;
            gl_Position = vec4(aPosition, 0.0, 1.0);
        }`;

        const fragmentShader = `#version 300 es
        precision highp float;
        uniform sampler2D uTexture;
        uniform vec2 uScreenSize;
        in vec2 vTexCoord;
        out vec4 fragColor;

        void main() {
            float FXAA_SPAN_MAX = 8.0;
            float FXAA_REDUCE_MUL = 1.0/8.0;
            float FXAA_REDUCE_MIN = 1.0/128.0;

            vec2 texelSize = 1.0 / uScreenSize;
            vec3 rgbNW = texture(uTexture, vTexCoord + vec2(-1.0, -1.0) * texelSize).rgb;
            vec3 rgbNE = texture(uTexture, vTexCoord + vec2(1.0, -1.0) * texelSize).rgb;
            vec3 rgbSW = texture(uTexture, vTexCoord + vec2(-1.0, 1.0) * texelSize).rgb;
            vec3 rgbSE = texture(uTexture, vTexCoord + vec2(1.0, 1.0) * texelSize).rgb;
            vec3 rgbM = texture(uTexture, vTexCoord).rgb;

            vec3 luma = vec3(0.299, 0.587, 0.114);
            float lumaNW = dot(rgbNW, luma);
            float lumaNE = dot(rgbNE, luma);
            float lumaSW = dot(rgbSW, luma);
            float lumaSE = dot(rgbSE, luma);
            float lumaM = dot(rgbM, luma);

            float lumaMin = min(lumaM, min(min(lumaNW, lumaNE), min(lumaSW, lumaSE)));
            float lumaMax = max(lumaM, max(max(lumaNW, lumaNE), max(lumaSW, lumaSE)));

            vec2 dir;
            dir.x = -((lumaNW + lumaNE) - (lumaSW + lumaSE));
            dir.y = ((lumaNW + lumaSW) - (lumaNE + lumaSE));

            float dirReduce = max(
                (lumaNW + lumaNE + lumaSW + lumaSE) * (0.25 * FXAA_REDUCE_MUL),
                FXAA_REDUCE_MIN);

            float rcpDirMin = 1.0/(min(abs(dir.x), abs(dir.y)) + dirReduce);

            dir = min(vec2(FXAA_SPAN_MAX), max(vec2(-FXAA_SPAN_MAX),
                  dir * rcpDirMin)) * texelSize;

            vec3 rgbA = 0.5 * (
                texture(uTexture, vTexCoord + dir * (1.0/3.0 - 0.5)).rgb +
                texture(uTexture, vTexCoord + dir * (2.0/3.0 - 0.5)).rgb);

            vec3 rgbB = rgbA * 0.5 + 0.25 * (
                texture(uTexture, vTexCoord + dir * -0.5).rgb +
                texture(uTexture, vTexCoord + dir * 0.5).rgb);

            float lumaB = dot(rgbB, luma);

            if(lumaB < lumaMin || lumaB > lumaMax)
                fragColor = vec4(rgbA, 1.0);
            else
                fragColor = vec4(rgbB, 1.0);
        }`;

        super(gl, vertexShader, fragmentShader);
    }

    setUniforms() {
        this.shader.setUniform2f('uScreenSize', this.gl.canvas.width, this.gl.canvas.height);
    }
}

// Vignette Effect
class VignetteEffect extends Effect {
    constructor(gl, intensity = 0.5, smoothness = 0.5) {
        const vertexShader = `#version 300 es
        layout(location = 0) in vec2 aPosition;
        layout(location = 1) in vec2 aTexCoord;
        out vec2 vTexCoord;
        void main() {
            vTexCoord = aTexCoord;
            gl_Position = vec4(aPosition, 0.0, 1.0);
        }`;

        const fragmentShader = `#version 300 es
        precision highp float;
        uniform sampler2D uTexture;
        uniform float uIntensity;
        uniform float uSmoothness;
        in vec2 vTexCoord;
        out vec4 fragColor;

        void main() {
            vec4 color = texture(uTexture, vTexCoord);
            vec2 position = vTexCoord - 0.5;
            float len = length(position);
            float vignette = smoothstep(0.8, uSmoothness * 0.799, len * uIntensity);
            fragColor = vec4(color.rgb * vignette, color.a);
        }`;

        super(gl, vertexShader, fragmentShader);
        this.intensity = intensity;
        this.smoothness = smoothness;
    }

    setUniforms() {
        this.shader.setUniform1f('uIntensity', this.intensity);
        this.shader.setUniform1f('uSmoothness', this.smoothness);
    }
} 