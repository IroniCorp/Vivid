import { ShaderMaterial, Vector2, WebGLRenderTarget } from 'three';

// Base Effect class
export class Effect {
    constructor(fragmentShader, uniforms = {}) {
        this.enabled = true;

        // Create material with custom shader
        this.material = new ShaderMaterial({
            uniforms: {
                tDiffuse: { value: null },
                resolution: { value: new Vector2() },
                ...uniforms
            },
            vertexShader: `
                varying vec2 vUv;
                void main() {
                    vUv = uv;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
            fragmentShader: fragmentShader
        });
    }

    setSize(width, height) {
        this.material.uniforms.resolution.value.set(width, height);
    }

    update(delta) {
        // Override in derived classes
    }

    dispose() {
        this.material.dispose();
    }
}

// Bloom Effect
export class BloomEffect extends Effect {
    constructor(options = {}) {
        super(
            `
            uniform sampler2D tDiffuse;
            uniform float threshold;
            uniform float intensity;
            varying vec2 vUv;

            void main() {
                vec4 color = texture2D(tDiffuse, vUv);
                float brightness = dot(color.rgb, vec3(0.2126, 0.7152, 0.0722));
                if(brightness > threshold) {
                    gl_FragColor = color * intensity;
                } else {
                    gl_FragColor = vec4(0.0);
                }
            }
            `,
            {
                threshold: { value: options.threshold || 0.5 },
                intensity: { value: options.intensity || 1.0 }
            }
        );
    }

    setThreshold(value) {
        this.material.uniforms.threshold.value = value;
    }

    setIntensity(value) {
        this.material.uniforms.intensity.value = value;
    }
}

// FXAA Effect (Fast Approximate Anti-Aliasing)
export class FXAAEffect extends Effect {
    constructor() {
        super(
            `
            uniform sampler2D tDiffuse;
            uniform vec2 resolution;
            varying vec2 vUv;

            void main() {
                vec2 texel = vec2(1.0 / resolution.x, 1.0 / resolution.y);
                
                vec3 rgbNW = texture2D(tDiffuse, vUv + vec2(-texel.x, -texel.y)).xyz;
                vec3 rgbNE = texture2D(tDiffuse, vUv + vec2(texel.x, -texel.y)).xyz;
                vec3 rgbSW = texture2D(tDiffuse, vUv + vec2(-texel.x, texel.y)).xyz;
                vec3 rgbSE = texture2D(tDiffuse, vUv + vec2(texel.x, texel.y)).xyz;
                vec3 rgbM = texture2D(tDiffuse, vUv).xyz;

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

                float dirReduce = max((lumaNW + lumaNE + lumaSW + lumaSE) * 0.25 * 0.5, 0.0);
                float stepLength = 0.0;
                dir = min(vec2(4.0, 4.0), max(vec2(-4.0, -4.0), dir * stepLength));

                vec3 result1 = 0.5 * (
                    texture2D(tDiffuse, vUv + dir * (1.0/3.0 - 0.5)).xyz +
                    texture2D(tDiffuse, vUv + dir * (2.0/3.0 - 0.5)).xyz);

                vec3 result2 = result1 * 0.5 + 0.25 * (
                    texture2D(tDiffuse, vUv + dir * (-0.5)).xyz +
                    texture2D(tDiffuse, vUv + dir * (0.5)).xyz);

                float lumaResult = dot(result2, luma);

                if(lumaResult < lumaMin || lumaResult > lumaMax)
                    gl_FragColor = vec4(result1, 1.0);
                else
                    gl_FragColor = vec4(result2, 1.0);
            }
            `
        );
    }
}

// Vignette Effect
export class VignetteEffect extends Effect {
    constructor(options = {}) {
        super(
            `
            uniform sampler2D tDiffuse;
            uniform float offset;
            uniform float darkness;
            varying vec2 vUv;

            void main() {
                vec4 color = texture2D(tDiffuse, vUv);
                vec2 center = vec2(0.5);
                float dist = distance(vUv, center) * offset;
                color.rgb *= smoothstep(0.8, darkness * 0.799, dist * (0.5 + darkness));
                gl_FragColor = color;
            }
            `,
            {
                offset: { value: options.offset || 1.0 },
                darkness: { value: options.darkness || 1.0 }
            }
        );
    }

    setOffset(value) {
        this.material.uniforms.offset.value = value;
    }

    setDarkness(value) {
        this.material.uniforms.darkness.value = value;
    }
} 