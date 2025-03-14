class Texture {
    constructor(gl, options = {}) {
        this.gl = gl;
        this.texture = gl.createTexture();
        this.target = options.target || gl.TEXTURE_2D;
        this.type = options.type || gl.UNSIGNED_BYTE;
        this.format = options.format || gl.RGBA;
        this.internalFormat = options.internalFormat || gl.RGBA;
        this.generateMipmaps = options.generateMipmaps !== false;

        // Create a default white texture
        this.setDefaultTexture();
    }

    setDefaultTexture() {
        const { gl } = this;
        gl.bindTexture(this.target, this.texture);
        const pixel = new Uint8Array([255, 255, 255, 255]);
        gl.texImage2D(this.target, 0, this.internalFormat, 1, 1, 0, this.format, this.type, pixel);
    }

    loadFromUrl(url) {
        return new Promise((resolve, reject) => {
            const image = new Image();
            image.crossOrigin = 'anonymous';
            
            image.onload = () => {
                this.loadFromImage(image);
                resolve(this);
            };
            
            image.onerror = () => {
                reject(new Error(`Failed to load texture from URL: ${url}`));
            };
            
            image.src = url;
        });
    }

    loadFromImage(image) {
        const { gl } = this;
        
        gl.bindTexture(this.target, this.texture);
        gl.texImage2D(this.target, 0, this.internalFormat, this.format, this.type, image);

        if (this.generateMipmaps && isPowerOf2(image.width) && isPowerOf2(image.height)) {
            gl.generateMipmap(this.target);
            gl.texParameteri(this.target, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
            gl.texParameteri(this.target, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        } else {
            gl.texParameteri(this.target, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
            gl.texParameteri(this.target, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
            gl.texParameteri(this.target, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(this.target, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        }
    }

    loadFromData(data, width, height) {
        const { gl } = this;
        
        gl.bindTexture(this.target, this.texture);
        gl.texImage2D(this.target, 0, this.internalFormat, width, height, 0, this.format, this.type, data);

        if (this.generateMipmaps && isPowerOf2(width) && isPowerOf2(height)) {
            gl.generateMipmap(this.target);
            gl.texParameteri(this.target, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
            gl.texParameteri(this.target, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        } else {
            gl.texParameteri(this.target, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
            gl.texParameteri(this.target, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
            gl.texParameteri(this.target, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(this.target, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        }
    }

    bind(unit = 0) {
        const { gl } = this;
        gl.activeTexture(gl.TEXTURE0 + unit);
        gl.bindTexture(this.target, this.texture);
        return unit;
    }

    dispose() {
        if (this.texture) {
            this.gl.deleteTexture(this.texture);
            this.texture = null;
        }
    }
}

// Utility function to check if a number is a power of 2
function isPowerOf2(value) {
    return (value & (value - 1)) === 0;
} 