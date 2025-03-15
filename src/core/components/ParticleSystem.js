import { 
    Points,
    BufferGeometry,
    Float32BufferAttribute,
    PointsMaterial,
    Color,
    AdditiveBlending,
    Vector3,
    Clock
} from 'three';
import { Component } from '../Component';

export class ParticleSystem extends Component {
    constructor(options = {}) {
        super();
        this.options = {
            maxParticles: options.maxParticles || 1000,
            particleSize: options.particleSize || 0.1,
            emissionRate: options.emissionRate || 10,
            lifetime: options.lifetime || 2,
            startColor: options.startColor || new Color(1, 1, 1),
            endColor: options.endColor || new Color(1, 1, 0),
            startSize: options.startSize || 1.0,
            endSize: options.endSize || 0.1,
            startSpeed: options.startSpeed || 1,
            endSpeed: options.endSpeed || 0.1,
            spread: options.spread || new Vector3(1, 1, 1),
            gravity: options.gravity || new Vector3(0, -9.81, 0),
            texture: options.texture || null,
            blending: options.blending || AdditiveBlending,
            loop: options.loop !== undefined ? options.loop : true
        };

        this.particles = [];
        this.geometry = null;
        this.material = null;
        this.points = null;
        this.clock = new Clock();
        this.active = true;
    }

    onAttach() {
        this.geometry = new BufferGeometry();
        this.material = new PointsMaterial({
            size: this.options.particleSize,
            map: this.options.texture,
            blending: this.options.blending,
            transparent: true,
            vertexColors: true
        });

        // Initialize buffer attributes
        const positions = new Float32Array(this.options.maxParticles * 3);
        const colors = new Float32Array(this.options.maxParticles * 3);
        const sizes = new Float32Array(this.options.maxParticles);
        
        this.geometry.setAttribute('position', new Float32BufferAttribute(positions, 3));
        this.geometry.setAttribute('color', new Float32BufferAttribute(colors, 3));
        this.geometry.setAttribute('size', new Float32BufferAttribute(sizes, 1));

        this.points = new Points(this.geometry, this.material);
        this.object.add(this.points);
    }

    onDetach() {
        if (this.points) {
            this.object.remove(this.points);
            this.geometry.dispose();
            this.material.dispose();
        }
    }

    emit(count = 1) {
        for (let i = 0; i < count; i++) {
            if (this.particles.length >= this.options.maxParticles) {
                if (!this.options.loop) {
                    this.active = false;
                }
                return;
            }

            const particle = {
                position: new Vector3(
                    (Math.random() - 0.5) * this.options.spread.x,
                    (Math.random() - 0.5) * this.options.spread.y,
                    (Math.random() - 0.5) * this.options.spread.z
                ).add(this.object.position),
                velocity: new Vector3(
                    (Math.random() - 0.5) * 2,
                    Math.random(),
                    (Math.random() - 0.5) * 2
                ).normalize().multiplyScalar(this.options.startSpeed),
                color: this.options.startColor.clone(),
                size: this.options.startSize,
                age: 0,
                lifetime: this.options.lifetime * (0.8 + Math.random() * 0.4)
            };

            this.particles.push(particle);
        }
    }

    update(deltaTime) {
        if (!this.active) return;

        // Emit new particles
        const emitCount = Math.floor(this.options.emissionRate * deltaTime);
        if (emitCount > 0) {
            this.emit(emitCount);
        }

        // Update particles
        const positions = this.geometry.attributes.position.array;
        const colors = this.geometry.attributes.color.array;
        const sizes = this.geometry.attributes.size.array;
        let visibleCount = 0;

        for (let i = this.particles.length - 1; i >= 0; i--) {
            const particle = this.particles[i];
            particle.age += deltaTime;

            if (particle.age >= particle.lifetime) {
                this.particles.splice(i, 1);
                continue;
            }

            // Update position
            particle.velocity.add(this.options.gravity.clone().multiplyScalar(deltaTime));
            particle.position.add(particle.velocity.clone().multiplyScalar(deltaTime));

            // Calculate life ratio
            const lifeRatio = particle.age / particle.lifetime;

            // Interpolate color
            particle.color.copy(this.options.startColor).lerp(this.options.endColor, lifeRatio);

            // Interpolate size
            particle.size = this.options.startSize + (this.options.endSize - this.options.startSize) * lifeRatio;

            // Update buffers
            const idx = visibleCount * 3;
            positions[idx] = particle.position.x;
            positions[idx + 1] = particle.position.y;
            positions[idx + 2] = particle.position.z;

            colors[idx] = particle.color.r;
            colors[idx + 1] = particle.color.g;
            colors[idx + 2] = particle.color.b;

            sizes[visibleCount] = particle.size;

            visibleCount++;
        }

        // Update geometry
        this.geometry.setDrawRange(0, visibleCount);
        this.geometry.attributes.position.needsUpdate = true;
        this.geometry.attributes.color.needsUpdate = true;
        this.geometry.attributes.size.needsUpdate = true;
    }

    setEmissionRate(rate) {
        this.options.emissionRate = rate;
    }

    setParticleSize(size) {
        this.options.particleSize = size;
        if (this.material) {
            this.material.size = size;
        }
    }

    setStartColor(color) {
        this.options.startColor = color;
    }

    setEndColor(color) {
        this.options.endColor = color;
    }

    setStartSize(size) {
        this.options.startSize = size;
    }

    setEndSize(size) {
        this.options.endSize = size;
    }

    setGravity(gravity) {
        this.options.gravity = gravity;
    }

    setSpread(spread) {
        this.options.spread = spread;
    }

    setLoop(loop) {
        this.options.loop = loop;
    }

    play() {
        this.active = true;
        this.clock.start();
    }

    pause() {
        this.active = false;
    }

    stop() {
        this.active = false;
        this.particles = [];
        this.geometry.setDrawRange(0, 0);
        this.geometry.attributes.position.needsUpdate = true;
        this.geometry.attributes.color.needsUpdate = true;
        this.geometry.attributes.size.needsUpdate = true;
    }

    toJSON() {
        return {
            ...super.toJSON(),
            options: {
                maxParticles: this.options.maxParticles,
                particleSize: this.options.particleSize,
                emissionRate: this.options.emissionRate,
                lifetime: this.options.lifetime,
                startColor: this.options.startColor.getHex(),
                endColor: this.options.endColor.getHex(),
                startSize: this.options.startSize,
                endSize: this.options.endSize,
                startSpeed: this.options.startSpeed,
                endSpeed: this.options.endSpeed,
                spread: {
                    x: this.options.spread.x,
                    y: this.options.spread.y,
                    z: this.options.spread.z
                },
                gravity: {
                    x: this.options.gravity.x,
                    y: this.options.gravity.y,
                    z: this.options.gravity.z
                },
                loop: this.options.loop
            }
        };
    }

    fromJSON(json) {
        super.fromJSON(json);
        this.options = {
            ...this.options,
            ...json.options,
            startColor: new Color(json.options.startColor),
            endColor: new Color(json.options.endColor),
            spread: new Vector3(
                json.options.spread.x,
                json.options.spread.y,
                json.options.spread.z
            ),
            gravity: new Vector3(
                json.options.gravity.x,
                json.options.gravity.y,
                json.options.gravity.z
            )
        };
    }
} 