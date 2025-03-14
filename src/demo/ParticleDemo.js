import { Engine } from '../core/Engine';
import { Camera } from '../core/Camera';
import { ParticleSystem } from '../core/ParticleSystem';
import { vec3 } from 'gl-matrix';

export class ParticleDemo {
    constructor(canvas) {
        this.engine = new Engine(canvas);
        this.gl = this.engine.gl;

        // Setup camera
        this.camera = new Camera(this.gl);
        this.camera.position = [0, 2, 5];
        this.camera.lookAt([0, 0, 0]);

        // Create particle systems
        this.setupParticleSystems();

        // Start animation loop
        this.lastTime = 0;
        this.animate = this.animate.bind(this);
        requestAnimationFrame(this.animate);
    }

    setupParticleSystems() {
        // Fountain particle system
        this.fountain = new ParticleSystem(this.gl, 2000);
        this.fountain.position = [0, 0, 0];
        this.fountain.direction = [0, 1, 0];
        this.fountain.spread = Math.PI / 6; // 30 degrees
        this.fountain.emissionRate = 200;
        this.fountain.minLife = 2.0;
        this.fountain.maxLife = 3.0;
        this.fountain.minSize = 0.05;
        this.fountain.maxSize = 0.1;
        this.fountain.minSpeed = 3.0;
        this.fountain.maxSpeed = 4.0;

        // Fire particle system
        this.fire = new ParticleSystem(this.gl, 1000);
        this.fire.position = [-2, 0, 0];
        this.fire.direction = [0, 1, 0];
        this.fire.spread = Math.PI / 3; // 60 degrees
        this.fire.emissionRate = 100;
        this.fire.minLife = 0.5;
        this.fire.maxLife = 1.0;
        this.fire.minSize = 0.1;
        this.fire.maxSize = 0.2;
        this.fire.minSpeed = 1.0;
        this.fire.maxSpeed = 2.0;

        // Smoke particle system
        this.smoke = new ParticleSystem(this.gl, 500);
        this.smoke.position = [2, 0, 0];
        this.smoke.direction = [0, 1, 0];
        this.smoke.spread = Math.PI / 4; // 45 degrees
        this.smoke.emissionRate = 20;
        this.smoke.minLife = 3.0;
        this.smoke.maxLife = 5.0;
        this.smoke.minSize = 0.2;
        this.smoke.maxSize = 0.4;
        this.smoke.minSpeed = 0.5;
        this.smoke.maxSpeed = 1.0;
    }

    animate(currentTime) {
        const deltaTime = (currentTime - this.lastTime) / 1000;
        this.lastTime = currentTime;

        // Clear the canvas
        this.gl.clearColor(0.1, 0.1, 0.1, 1.0);
        this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);

        // Update and render particle systems
        this.fountain.update(deltaTime);
        this.fountain.render(this.camera);

        this.fire.update(deltaTime);
        this.fire.render(this.camera);

        this.smoke.update(deltaTime);
        this.smoke.render(this.camera);

        requestAnimationFrame(this.animate);
    }

    dispose() {
        this.fountain.dispose();
        this.fire.dispose();
        this.smoke.dispose();
    }
} 