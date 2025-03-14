class Material {
    constructor(gl, options = {}) {
        this.gl = gl;
        
        // PBR material properties
        this.albedo = options.albedo || [1.0, 1.0, 1.0];
        this.metallic = options.metallic || 0.0;
        this.roughness = options.roughness || 0.5;
        this.ao = options.ao || 1.0;

        // Textures
        this.albedoMap = null;
        this.metallicMap = null;
        this.roughnessMap = null;
        this.normalMap = null;
        this.aoMap = null;
        this.emissiveMap = null;

        // Additional properties
        this.emissive = options.emissive || [0.0, 0.0, 0.0];
        this.emissiveIntensity = options.emissiveIntensity || 1.0;
        this.normalScale = options.normalScale || 1.0;
    }

    setAlbedoMap(texture) {
        this.albedoMap = texture;
    }

    setMetallicMap(texture) {
        this.metallicMap = texture;
    }

    setRoughnessMap(texture) {
        this.roughnessMap = texture;
    }

    setNormalMap(texture) {
        this.normalMap = texture;
    }

    setAOMap(texture) {
        this.aoMap = texture;
    }

    setEmissiveMap(texture) {
        this.emissiveMap = texture;
    }

    bind(shader) {
        // Set material properties
        shader.setUniform3f('uMaterial.albedo', ...this.albedo);
        shader.setUniform1f('uMaterial.metallic', this.metallic);
        shader.setUniform1f('uMaterial.roughness', this.roughness);
        shader.setUniform1f('uMaterial.ao', this.ao);
        shader.setUniform3f('uMaterial.emissive', ...this.emissive);
        shader.setUniform1f('uMaterial.emissiveIntensity', this.emissiveIntensity);
        shader.setUniform1f('uMaterial.normalScale', this.normalScale);

        // Bind textures
        let textureUnit = 0;

        if (this.albedoMap) {
            const unit = this.albedoMap.bind(textureUnit++);
            shader.setUniform1i('uMaterial.albedoMap', unit);
            shader.setUniform1i('uMaterial.hasAlbedoMap', 1);
        } else {
            shader.setUniform1i('uMaterial.hasAlbedoMap', 0);
        }

        if (this.metallicMap) {
            const unit = this.metallicMap.bind(textureUnit++);
            shader.setUniform1i('uMaterial.metallicMap', unit);
            shader.setUniform1i('uMaterial.hasMetallicMap', 1);
        } else {
            shader.setUniform1i('uMaterial.hasMetallicMap', 0);
        }

        if (this.roughnessMap) {
            const unit = this.roughnessMap.bind(textureUnit++);
            shader.setUniform1i('uMaterial.roughnessMap', unit);
            shader.setUniform1i('uMaterial.hasRoughnessMap', 1);
        } else {
            shader.setUniform1i('uMaterial.hasRoughnessMap', 0);
        }

        if (this.normalMap) {
            const unit = this.normalMap.bind(textureUnit++);
            shader.setUniform1i('uMaterial.normalMap', unit);
            shader.setUniform1i('uMaterial.hasNormalMap', 1);
        } else {
            shader.setUniform1i('uMaterial.hasNormalMap', 0);
        }

        if (this.aoMap) {
            const unit = this.aoMap.bind(textureUnit++);
            shader.setUniform1i('uMaterial.aoMap', unit);
            shader.setUniform1i('uMaterial.hasAOMap', 1);
        } else {
            shader.setUniform1i('uMaterial.hasAOMap', 0);
        }

        if (this.emissiveMap) {
            const unit = this.emissiveMap.bind(textureUnit++);
            shader.setUniform1i('uMaterial.emissiveMap', unit);
            shader.setUniform1i('uMaterial.hasEmissiveMap', 1);
        } else {
            shader.setUniform1i('uMaterial.hasEmissiveMap', 0);
        }
    }

    dispose() {
        // Dispose of all textures
        if (this.albedoMap) this.albedoMap.dispose();
        if (this.metallicMap) this.metallicMap.dispose();
        if (this.roughnessMap) this.roughnessMap.dispose();
        if (this.normalMap) this.normalMap.dispose();
        if (this.aoMap) this.aoMap.dispose();
        if (this.emissiveMap) this.emissiveMap.dispose();
    }
} 