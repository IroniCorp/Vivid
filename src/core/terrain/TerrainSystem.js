import {
    PlaneGeometry,
    MeshStandardMaterial,
    Mesh,
    Vector3,
    Raycaster,
    TextureLoader,
    RepeatWrapping,
    BufferAttribute,
    Color,
    ShaderMaterial,
    DoubleSide
} from 'three';

/**
 * Terrain System for Vivid Engine
 * Supports heightmap-based terrain with texture splatting
 */
export class TerrainSystem {
    constructor(scene, renderer) {
        this.scene = scene;
        this.renderer = renderer;
        this.terrains = new Map();
        this.textureLoader = new TextureLoader();
        this.raycaster = new Raycaster();
    }
    
    /**
     * Create a new terrain
     * @param {object} options - Terrain options
     * @returns {object} The created terrain
     */
    createTerrain(options = {}) {
        const {
            width = 100,
            height = 100,
            segmentsX = 100,
            segmentsZ = 100,
            heightScale = 10,
            heightmap = null,
            position = { x: 0, y: 0, z: 0 },
            textures = [],
            splatmap = null,
            name = `terrain_${Date.now()}`
        } = options;
        
        // Create geometry
        const geometry = new PlaneGeometry(width, height, segmentsX, segmentsZ);
        geometry.rotateX(-Math.PI / 2); // Make it horizontal
        
        // Apply heightmap if provided
        if (heightmap) {
            this.applyHeightmap(geometry, heightmap, heightScale);
        }
        
        // Create material
        let material;
        
        if (textures.length > 0 && splatmap) {
            // Create splatmap material
            material = this.createSplatmapMaterial(textures, splatmap);
        } else {
            // Create simple material
            material = new MeshStandardMaterial({
                color: 0x808080,
                roughness: 0.8,
                metalness: 0.2,
                wireframe: false,
                flatShading: true,
                side: DoubleSide
            });
        }
        
        // Create mesh
        const mesh = new Mesh(geometry, material);
        mesh.name = name;
        mesh.position.set(position.x, position.y, position.z);
        mesh.receiveShadow = true;
        mesh.castShadow = true;
        
        // Add to scene
        this.scene.add(mesh);
        
        // Store terrain data
        const terrain = {
            id: mesh.uuid,
            mesh,
            width,
            height,
            segmentsX,
            segmentsZ,
            heightScale,
            heightmap,
            textures,
            splatmap,
            brushes: []
        };
        
        this.terrains.set(mesh.uuid, terrain);
        
        return terrain;
    }
    
    /**
     * Apply a heightmap to a geometry
     * @param {PlaneGeometry} geometry - The geometry to modify
     * @param {ImageData|Uint8Array|Float32Array} heightmap - Heightmap data
     * @param {number} scale - Height scale factor
     */
    applyHeightmap(geometry, heightmap, scale = 10) {
        const positions = geometry.attributes.position.array;
        
        // Handle different heightmap formats
        let getHeight;
        
        if (heightmap instanceof ImageData) {
            // ImageData (from canvas)
            const { width, height, data } = heightmap;
            getHeight = (x, z) => {
                const u = Math.min(Math.max(x, 0), 1);
                const v = Math.min(Math.max(z, 0), 1);
                const ix = Math.floor(u * (width - 1));
                const iz = Math.floor(v * (height - 1));
                const index = (iz * width + ix) * 4;
                // Use red channel as height
                return data[index] / 255;
            };
        } else if (heightmap instanceof Uint8Array) {
            // Uint8Array (8-bit grayscale)
            const size = Math.sqrt(heightmap.length);
            getHeight = (x, z) => {
                const u = Math.min(Math.max(x, 0), 1);
                const v = Math.min(Math.max(z, 0), 1);
                const ix = Math.floor(u * (size - 1));
                const iz = Math.floor(v * (size - 1));
                const index = iz * size + ix;
                return heightmap[index] / 255;
            };
        } else if (heightmap instanceof Float32Array) {
            // Float32Array (normalized 0-1)
            const size = Math.sqrt(heightmap.length);
            getHeight = (x, z) => {
                const u = Math.min(Math.max(x, 0), 1);
                const v = Math.min(Math.max(z, 0), 1);
                const ix = Math.floor(u * (size - 1));
                const iz = Math.floor(v * (size - 1));
                const index = iz * size + ix;
                return heightmap[index];
            };
        } else {
            // Function
            getHeight = heightmap;
        }
        
        // Apply heightmap to vertices
        const width = geometry.parameters.width;
        const height = geometry.parameters.height;
        const segmentsX = geometry.parameters.widthSegments;
        const segmentsZ = geometry.parameters.heightSegments;
        
        for (let i = 0; i < positions.length; i += 3) {
            const x = positions[i];
            const z = positions[i + 2];
            
            // Convert to UV coordinates (0-1)
            const u = (x + width / 2) / width;
            const v = (z + height / 2) / height;
            
            // Get height from heightmap
            const h = getHeight(u, v);
            
            // Apply height
            positions[i + 1] = h * scale;
        }
        
        // Update geometry
        geometry.attributes.position.needsUpdate = true;
        geometry.computeVertexNormals();
    }
    
    /**
     * Create a material with texture splatting
     * @param {Array} textures - Array of texture objects { map, normalMap, roughnessMap, scale }
     * @param {object} splatmap - Splatmap texture or data
     * @returns {ShaderMaterial} The created material
     */
    createSplatmapMaterial(textures, splatmap) {
        // Load textures
        const maps = textures.map(tex => {
            const diffuse = this.textureLoader.load(tex.map);
            diffuse.wrapS = diffuse.wrapT = RepeatWrapping;
            
            let normal = null;
            if (tex.normalMap) {
                normal = this.textureLoader.load(tex.normalMap);
                normal.wrapS = normal.wrapT = RepeatWrapping;
            }
            
            let roughness = null;
            if (tex.roughnessMap) {
                roughness = this.textureLoader.load(tex.roughnessMap);
                roughness.wrapS = roughness.wrapT = RepeatWrapping;
            }
            
            return {
                diffuse,
                normal,
                roughness,
                scale: tex.scale || 1
            };
        });
        
        // Load splatmap
        let splatmapTexture;
        if (typeof splatmap === 'string') {
            splatmapTexture = this.textureLoader.load(splatmap);
        } else if (splatmap.isTexture) {
            splatmapTexture = splatmap;
        }
        
        // Create shader material
        const material = new ShaderMaterial({
            uniforms: {
                splatMap: { value: splatmapTexture },
                texture1: { value: maps[0]?.diffuse || null },
                texture2: { value: maps[1]?.diffuse || null },
                texture3: { value: maps[2]?.diffuse || null },
                texture4: { value: maps[3]?.diffuse || null },
                normalMap1: { value: maps[0]?.normal || null },
                normalMap2: { value: maps[1]?.normal || null },
                normalMap3: { value: maps[2]?.normal || null },
                normalMap4: { value: maps[3]?.normal || null },
                textureScale1: { value: maps[0]?.scale || 1 },
                textureScale2: { value: maps[1]?.scale || 1 },
                textureScale3: { value: maps[2]?.scale || 1 },
                textureScale4: { value: maps[3]?.scale || 1 },
                useNormalMap: { value: maps.some(m => m.normal !== null) ? 1.0 : 0.0 }
            },
            vertexShader: `
                varying vec2 vUv;
                varying vec3 vNormal;
                varying vec3 vPosition;
                
                void main() {
                    vUv = uv;
                    vNormal = normal;
                    vPosition = position;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
            fragmentShader: `
                uniform sampler2D splatMap;
                uniform sampler2D texture1;
                uniform sampler2D texture2;
                uniform sampler2D texture3;
                uniform sampler2D texture4;
                uniform sampler2D normalMap1;
                uniform sampler2D normalMap2;
                uniform sampler2D normalMap3;
                uniform sampler2D normalMap4;
                uniform float textureScale1;
                uniform float textureScale2;
                uniform float textureScale3;
                uniform float textureScale4;
                uniform float useNormalMap;
                
                varying vec2 vUv;
                varying vec3 vNormal;
                varying vec3 vPosition;
                
                void main() {
                    // Sample the splatmap
                    vec4 splatMapColor = texture2D(splatMap, vUv);
                    
                    // Sample the textures with proper scaling
                    vec4 tex1 = texture2D(texture1, vUv * textureScale1);
                    vec4 tex2 = texture2D(texture2, vUv * textureScale2);
                    vec4 tex3 = texture2D(texture3, vUv * textureScale3);
                    vec4 tex4 = texture2D(texture4, vUv * textureScale4);
                    
                    // Mix textures based on splatmap
                    vec4 color = 
                        tex1 * splatMapColor.r +
                        tex2 * splatMapColor.g +
                        tex3 * splatMapColor.b +
                        tex4 * splatMapColor.a;
                    
                    gl_FragColor = color;
                }
            `,
            side: DoubleSide
        });
        
        return material;
    }
    
    /**
     * Add a terrain brush
     * @param {string} terrainId - ID of the terrain
     * @param {object} brush - Brush definition
     * @returns {object} The created brush
     */
    addBrush(terrainId, brush = {}) {
        const terrain = this.terrains.get(terrainId);
        if (!terrain) return null;
        
        const {
            type = 'raise',
            size = 5,
            strength = 0.1,
            falloff = 0.5,
            texture = 0
        } = brush;
        
        const newBrush = {
            id: `brush_${Date.now()}`,
            type,
            size,
            strength,
            falloff,
            texture,
            position: new Vector3()
        };
        
        terrain.brushes.push(newBrush);
        return newBrush;
    }
    
    /**
     * Apply a brush to the terrain at a position
     * @param {string} terrainId - ID of the terrain
     * @param {string} brushId - ID of the brush
     * @param {Vector3} position - World position to apply the brush
     */
    applyBrush(terrainId, brushId, position) {
        const terrain = this.terrains.get(terrainId);
        if (!terrain) return;
        
        const brush = terrain.brushes.find(b => b.id === brushId);
        if (!brush) return;
        
        // Update brush position
        brush.position.copy(position);
        
        // Get terrain local position
        const localPos = position.clone().sub(terrain.mesh.position);
        
        // Get terrain geometry
        const geometry = terrain.mesh.geometry;
        const positions = geometry.attributes.position.array;
        
        // Apply brush based on type
        switch (brush.type) {
            case 'raise':
                this.applyRaiseBrush(terrain, brush, localPos, positions);
                break;
            case 'lower':
                this.applyLowerBrush(terrain, brush, localPos, positions);
                break;
            case 'smooth':
                this.applySmoothBrush(terrain, brush, localPos, positions);
                break;
            case 'flatten':
                this.applyFlattenBrush(terrain, brush, localPos, positions);
                break;
            case 'paint':
                this.applyPaintBrush(terrain, brush, localPos);
                break;
        }
        
        // Update geometry
        if (brush.type !== 'paint') {
            geometry.attributes.position.needsUpdate = true;
            geometry.computeVertexNormals();
        }
    }
    
    /**
     * Apply a raise brush to the terrain
     * @private
     */
    applyRaiseBrush(terrain, brush, position, positions) {
        const size = brush.size;
        const strength = brush.strength;
        const falloff = brush.falloff;
        
        for (let i = 0; i < positions.length; i += 3) {
            const x = positions[i];
            const y = positions[i + 1];
            const z = positions[i + 2];
            
            const dx = x - position.x;
            const dz = z - position.z;
            const distance = Math.sqrt(dx * dx + dz * dz);
            
            if (distance < size) {
                // Calculate falloff
                const falloffFactor = 1 - Math.pow(distance / size, falloff);
                
                // Raise vertex
                positions[i + 1] += strength * falloffFactor;
            }
        }
    }
    
    /**
     * Apply a lower brush to the terrain
     * @private
     */
    applyLowerBrush(terrain, brush, position, positions) {
        const size = brush.size;
        const strength = brush.strength;
        const falloff = brush.falloff;
        
        for (let i = 0; i < positions.length; i += 3) {
            const x = positions[i];
            const y = positions[i + 1];
            const z = positions[i + 2];
            
            const dx = x - position.x;
            const dz = z - position.z;
            const distance = Math.sqrt(dx * dx + dz * dz);
            
            if (distance < size) {
                // Calculate falloff
                const falloffFactor = 1 - Math.pow(distance / size, falloff);
                
                // Lower vertex
                positions[i + 1] -= strength * falloffFactor;
            }
        }
    }
    
    /**
     * Apply a smooth brush to the terrain
     * @private
     */
    applySmoothBrush(terrain, brush, position, positions) {
        const size = brush.size;
        const strength = brush.strength;
        const falloff = brush.falloff;
        
        // First pass: calculate average height
        let totalHeight = 0;
        let count = 0;
        
        for (let i = 0; i < positions.length; i += 3) {
            const x = positions[i];
            const y = positions[i + 1];
            const z = positions[i + 2];
            
            const dx = x - position.x;
            const dz = z - position.z;
            const distance = Math.sqrt(dx * dx + dz * dz);
            
            if (distance < size) {
                totalHeight += y;
                count++;
            }
        }
        
        const averageHeight = count > 0 ? totalHeight / count : 0;
        
        // Second pass: smooth heights
        for (let i = 0; i < positions.length; i += 3) {
            const x = positions[i];
            const y = positions[i + 1];
            const z = positions[i + 2];
            
            const dx = x - position.x;
            const dz = z - position.z;
            const distance = Math.sqrt(dx * dx + dz * dz);
            
            if (distance < size) {
                // Calculate falloff
                const falloffFactor = 1 - Math.pow(distance / size, falloff);
                
                // Smooth vertex
                positions[i + 1] += (averageHeight - y) * strength * falloffFactor;
            }
        }
    }
    
    /**
     * Apply a flatten brush to the terrain
     * @private
     */
    applyFlattenBrush(terrain, brush, position, positions) {
        const size = brush.size;
        const strength = brush.strength;
        const falloff = brush.falloff;
        
        // Use the height at the center point
        const targetHeight = position.y;
        
        for (let i = 0; i < positions.length; i += 3) {
            const x = positions[i];
            const y = positions[i + 1];
            const z = positions[i + 2];
            
            const dx = x - position.x;
            const dz = z - position.z;
            const distance = Math.sqrt(dx * dx + dz * dz);
            
            if (distance < size) {
                // Calculate falloff
                const falloffFactor = 1 - Math.pow(distance / size, falloff);
                
                // Flatten vertex
                positions[i + 1] += (targetHeight - y) * strength * falloffFactor;
            }
        }
    }
    
    /**
     * Apply a paint brush to the terrain
     * @private
     */
    applyPaintBrush(terrain, brush, position) {
        // This would modify the splatmap texture
        // For simplicity, we'll just log that painting would happen here
        console.log('Painting texture', brush.texture, 'at position', position);
        
        // In a real implementation, this would:
        // 1. Get the splatmap texture
        // 2. Convert position to UV coordinates
        // 3. Modify the splatmap pixels
        // 4. Update the texture
    }
    
    /**
     * Get height at a specific world position
     * @param {string} terrainId - ID of the terrain
     * @param {Vector3} position - World position
     * @returns {number} Height at the position
     */
    getHeightAt(terrainId, position) {
        const terrain = this.terrains.get(terrainId);
        if (!terrain) return 0;
        
        // Create a ray pointing downward
        this.raycaster.set(
            new Vector3(position.x, 1000, position.z),
            new Vector3(0, -1, 0)
        );
        
        // Raycast against the terrain
        const intersects = this.raycaster.intersectObject(terrain.mesh);
        
        if (intersects.length > 0) {
            return intersects[0].point.y;
        }
        
        return 0;
    }
    
    /**
     * Export terrain to a heightmap
     * @param {string} terrainId - ID of the terrain
     * @param {number} resolution - Resolution of the heightmap
     * @returns {Float32Array} Heightmap data
     */
    exportHeightmap(terrainId, resolution = 256) {
        const terrain = this.terrains.get(terrainId);
        if (!terrain) return null;
        
        const heightmap = new Float32Array(resolution * resolution);
        const geometry = terrain.mesh.geometry;
        const positions = geometry.attributes.position.array;
        
        // Find min/max height
        let minHeight = Infinity;
        let maxHeight = -Infinity;
        
        for (let i = 0; i < positions.length; i += 3) {
            const height = positions[i + 1];
            minHeight = Math.min(minHeight, height);
            maxHeight = Math.max(maxHeight, height);
        }
        
        const heightRange = maxHeight - minHeight;
        
        // Sample heights
        for (let z = 0; z < resolution; z++) {
            for (let x = 0; x < resolution; x++) {
                const u = x / (resolution - 1);
                const v = z / (resolution - 1);
                
                const worldX = (u - 0.5) * terrain.width;
                const worldZ = (v - 0.5) * terrain.height;
                
                const height = this.getHeightAt(terrainId, new Vector3(
                    worldX + terrain.mesh.position.x,
                    0,
                    worldZ + terrain.mesh.position.z
                ));
                
                // Normalize height
                const normalizedHeight = heightRange > 0 
                    ? (height - minHeight) / heightRange 
                    : 0;
                
                heightmap[z * resolution + x] = normalizedHeight;
            }
        }
        
        return heightmap;
    }
    
    /**
     * Update all terrains
     * @param {number} deltaTime - Time since last frame in seconds
     */
    update(deltaTime) {
        // Nothing to update in the basic implementation
        // This could be used for terrain animations, water, etc.
    }
} 