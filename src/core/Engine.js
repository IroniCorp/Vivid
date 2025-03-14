class Engine {
    constructor(options) {
        this.canvas = options.canvas;
        this.isRunning = false;
        this.lastFrameTime = 0;
        
        // Initialize WebGL2 context
        const gl = this.canvas.getContext('webgl2');
        if (!gl) {
            throw new Error('WebGL2 is not supported in this browser');
        }
        this.gl = gl;

        // Set canvas size
        this.resize(options.width || window.innerWidth, options.height || window.innerHeight);

        // Setup initial WebGL state
        this.gl.enable(this.gl.DEPTH_TEST);
        this.gl.enable(this.gl.CULL_FACE);
        this.gl.cullFace(this.gl.BACK);
    }

    start() {
        if (!this.isRunning) {
            this.isRunning = true;
            this.lastFrameTime = performance.now();
            requestAnimationFrame(this.gameLoop.bind(this));
        }
    }

    stop() {
        this.isRunning = false;
    }

    resize(width, height) {
        this.canvas.width = width;
        this.canvas.height = height;
        this.gl.viewport(0, 0, width, height);
    }

    gameLoop(currentTime) {
        if (!this.isRunning) return;

        const deltaTime = (currentTime - this.lastFrameTime) / 1000;
        this.lastFrameTime = currentTime;

        // Clear the canvas
        this.gl.clearColor(0.1, 0.1, 0.1, 1.0);
        this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);

        // Update and render logic will go here
        this.update(deltaTime);
        this.render();

        requestAnimationFrame(this.gameLoop.bind(this));
    }

    update(deltaTime) {
        // Update logic will be implemented here
    }

    render() {
        // Render logic will be implemented here
    }

    get context() {
        return this.gl;
    }
} 