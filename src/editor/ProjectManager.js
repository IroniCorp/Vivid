import { EventDispatcher } from 'three';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

export class ProjectManager extends EventDispatcher {
    constructor(editor) {
        super();
        this.editor = editor;
        this.projectData = {
            name: 'Untitled Project',
            version: '1.0.0',
            description: '',
            author: '',
            created: new Date().toISOString(),
            lastModified: new Date().toISOString(),
            settings: {
                physics: {
                    enabled: true,
                    gravity: { x: 0, y: -9.81, z: 0 }
                },
                rendering: {
                    shadows: true,
                    postProcessing: true,
                    antialiasing: true
                },
                editor: {
                    grid: true,
                    axes: true,
                    stats: true,
                    snapToGrid: false,
                    gridSize: 1
                }
            }
        };
        
        this.autosaveInterval = null;
        this.setupAutosave();
    }
    
    /**
     * Set up autosave functionality
     */
    setupAutosave() {
        // Autosave every 5 minutes
        const AUTOSAVE_INTERVAL = 5 * 60 * 1000;
        
        this.autosaveInterval = setInterval(() => {
            this.autosave();
        }, AUTOSAVE_INTERVAL);
    }
    
    /**
     * Create a new project
     * @param {object} projectData - Initial project data
     */
    createProject(projectData = {}) {
        // Clear the current scene
        while (this.editor.scene.children.length > 0) {
            this.editor.scene.remove(this.editor.scene.children[0]);
        }
        
        // Reset project data
        this.projectData = {
            ...this.projectData,
            ...projectData,
            created: new Date().toISOString(),
            lastModified: new Date().toISOString()
        };
        
        // Set up default scene
        this.setupDefaultScene();
        
        // Apply project settings
        this.applyProjectSettings();
        
        this.dispatchEvent({ type: 'projectCreated', projectData: this.projectData });
    }
    
    /**
     * Set up the default scene for a new project
     */
    setupDefaultScene() {
        // Add default lighting
        const ambientLight = this.editor.scene.getObjectByName('Ambient Light');
        if (!ambientLight) {
            this.editor.createObject('AmbientLight', {
                name: 'Ambient Light',
                intensity: 0.5
            });
        }
        
        const directionalLight = this.editor.scene.getObjectByName('Directional Light');
        if (!directionalLight) {
            this.editor.createObject('DirectionalLight', {
                name: 'Directional Light',
                intensity: 0.8,
                position: { x: 5, y: 5, z: 5 },
                castShadow: true
            });
        }
        
        // Add default ground plane
        const ground = this.editor.scene.getObjectByName('Ground');
        if (!ground) {
            this.editor.createObject('Plane', {
                name: 'Ground',
                width: 20,
                height: 20,
                material: {
                    color: 0x808080,
                    roughness: 0.8,
                    metalness: 0.2
                },
                receiveShadow: true
            });
        }
    }
    
    /**
     * Apply project settings
     */
    applyProjectSettings() {
        const { settings } = this.projectData;
        
        // Apply physics settings
        if (this.editor.physics) {
            this.editor.physics.enabled = settings.physics.enabled;
            this.editor.physics.setGravity(settings.physics.gravity);
        }
        
        // Apply rendering settings
        this.editor.renderer.shadowMap.enabled = settings.rendering.shadows;
        
        if (this.editor.postProcessor) {
            this.editor.postProcessor.enabled = settings.rendering.postProcessing;
        }
        
        // Apply editor settings
        this.editor.grid.visible = settings.editor.grid;
        this.editor.axes.visible = settings.editor.axes;
        this.editor.stats.dom.style.display = settings.editor.stats ? 'block' : 'none';
        
        if (this.editor.transformControls) {
            this.editor.transformControls.snapToGrid = settings.editor.snapToGrid;
            this.editor.transformControls.gridSize = settings.editor.gridSize;
        }
    }
    
    /**
     * Save the current project
     * @returns {Promise<object>} The saved project data
     */
    async saveProject() {
        try {
            // Update last modified timestamp
            this.projectData.lastModified = new Date().toISOString();
            
            // Export scene to GLTF
            const gltfExporter = new GLTFExporter();
            const gltfData = await new Promise((resolve, reject) => {
                gltfExporter.parse(this.editor.scene, resolve, { binary: true });
            });
            
            // Create project file
            const projectFile = {
                projectData: this.projectData,
                scene: gltfData,
                assets: await this.exportAssets()
            };
            
            // Save to file
            const blob = new Blob([JSON.stringify(projectFile)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            
            // Trigger download
            const link = document.createElement('a');
            link.href = url;
            link.download = `${this.projectData.name}.vivid`;
            link.click();
            
            // Cleanup
            URL.revokeObjectURL(url);
            
            this.dispatchEvent({ type: 'projectSaved', projectData: this.projectData });
            return this.projectData;
        } catch (error) {
            console.error('Error saving project:', error);
            throw error;
        }
    }
    
    /**
     * Load a project from a file
     * @param {File} file - The project file to load
     * @returns {Promise<object>} The loaded project data
     */
    async loadProject(file) {
        try {
            const reader = new FileReader();
            
            const projectFile = await new Promise((resolve, reject) => {
                reader.onload = (e) => {
                    try {
                        resolve(JSON.parse(e.target.result));
                    } catch (error) {
                        reject(error);
                    }
                };
                reader.onerror = reject;
                reader.readAsText(file);
            });
            
            // Load project data
            this.projectData = projectFile.projectData;
            
            // Clear current scene
            while (this.editor.scene.children.length > 0) {
                this.editor.scene.remove(this.editor.scene.children[0]);
            }
            
            // Load scene from GLTF
            const loader = new GLTFLoader();
            const gltf = await new Promise((resolve, reject) => {
                const blob = new Blob([projectFile.scene], { type: 'model/gltf-binary' });
                const url = URL.createObjectURL(blob);
                loader.load(url, resolve, undefined, reject);
                URL.revokeObjectURL(url);
            });
            
            this.editor.scene.add(gltf.scene);
            
            // Load assets
            await this.importAssets(projectFile.assets);
            
            // Apply project settings
            this.applyProjectSettings();
            
            this.dispatchEvent({ type: 'projectLoaded', projectData: this.projectData });
            return this.projectData;
        } catch (error) {
            console.error('Error loading project:', error);
            throw error;
        }
    }
    
    /**
     * Export project assets
     * @returns {Promise<object>} The exported assets data
     */
    async exportAssets() {
        const assets = {};
        
        if (this.editor.assetBrowser) {
            for (const [id, asset] of this.editor.assetBrowser.assets) {
                assets[id] = {
                    name: asset.name,
                    category: asset.category,
                    type: asset.type,
                    data: await this.serializeAsset(asset)
                };
            }
        }
        
        return assets;
    }
    
    /**
     * Import project assets
     * @param {object} assetsData - The assets data to import
     */
    async importAssets(assetsData) {
        if (!this.editor.assetBrowser) return;
        
        for (const [id, assetData] of Object.entries(assetsData)) {
            try {
                const asset = await this.deserializeAsset(assetData);
                this.editor.assetBrowser.addAsset(asset);
            } catch (error) {
                console.error(`Error importing asset ${assetData.name}:`, error);
            }
        }
    }
    
    /**
     * Serialize an asset for saving
     * @param {object} asset - The asset to serialize
     * @returns {Promise<object>} The serialized asset data
     */
    async serializeAsset(asset) {
        switch (asset.category) {
            case 'textures':
                return new Promise((resolve) => {
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');
                    const img = asset.data.image;
                    canvas.width = img.width;
                    canvas.height = img.height;
                    ctx.drawImage(img, 0, 0);
                    canvas.toBlob(resolve);
                });
                
            case 'audio':
                return asset.data.buffer;
                
            default:
                return asset.data;
        }
    }
    
    /**
     * Deserialize an asset from saved data
     * @param {object} assetData - The asset data to deserialize
     * @returns {Promise<object>} The deserialized asset
     */
    async deserializeAsset(assetData) {
        const asset = {
            id: `asset_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
            name: assetData.name,
            category: assetData.category,
            type: assetData.type
        };
        
        switch (assetData.category) {
            case 'textures':
                asset.data = await this.editor.assetBrowser.loaders.texture.loadAsync(
                    URL.createObjectURL(assetData.data)
                );
                break;
                
            case 'audio':
                asset.data = await this.editor.assetBrowser.loaders.audio.loadAsync(
                    URL.createObjectURL(new Blob([assetData.data]))
                );
                break;
                
            default:
                asset.data = assetData.data;
        }
        
        return asset;
    }
    
    /**
     * Perform an autosave
     */
    async autosave() {
        try {
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const autosaveData = {
                projectData: this.projectData,
                scene: await new Promise((resolve) => {
                    const exporter = new GLTFExporter();
                    exporter.parse(this.editor.scene, resolve, { binary: true });
                }),
                assets: await this.exportAssets()
            };
            
            // Save to localStorage
            localStorage.setItem(
                `vivid_autosave_${timestamp}`,
                JSON.stringify(autosaveData)
            );
            
            // Keep only the last 5 autosaves
            const autosaves = Object.keys(localStorage)
                .filter(key => key.startsWith('vivid_autosave_'))
                .sort()
                .reverse();
                
            while (autosaves.length > 5) {
                localStorage.removeItem(autosaves.pop());
            }
            
            console.log('Autosave completed:', timestamp);
        } catch (error) {
            console.error('Error during autosave:', error);
        }
    }
    
    /**
     * Load the most recent autosave
     * @returns {Promise<object>} The loaded project data
     */
    async loadAutosave() {
        try {
            const autosaves = Object.keys(localStorage)
                .filter(key => key.startsWith('vivid_autosave_'))
                .sort()
                .reverse();
                
            if (autosaves.length === 0) {
                throw new Error('No autosaves found');
            }
            
            const autosaveData = JSON.parse(localStorage.getItem(autosaves[0]));
            
            // Load project data
            this.projectData = autosaveData.projectData;
            
            // Clear current scene
            while (this.editor.scene.children.length > 0) {
                this.editor.scene.remove(this.editor.scene.children[0]);
            }
            
            // Load scene from GLTF
            const loader = new GLTFLoader();
            const gltf = await new Promise((resolve, reject) => {
                const blob = new Blob([autosaveData.scene], { type: 'model/gltf-binary' });
                const url = URL.createObjectURL(blob);
                loader.load(url, resolve, undefined, reject);
                URL.revokeObjectURL(url);
            });
            
            this.editor.scene.add(gltf.scene);
            
            // Load assets
            await this.importAssets(autosaveData.assets);
            
            // Apply project settings
            this.applyProjectSettings();
            
            this.dispatchEvent({ type: 'autosaveLoaded', projectData: this.projectData });
            return this.projectData;
        } catch (error) {
            console.error('Error loading autosave:', error);
            throw error;
        }
    }
    
    /**
     * Clean up resources
     */
    dispose() {
        if (this.autosaveInterval) {
            clearInterval(this.autosaveInterval);
            this.autosaveInterval = null;
        }
    }
} 