import { TextureLoader, AudioLoader, FileLoader } from 'three';
import { EventDispatcher } from 'three';

export class AssetBrowser extends EventDispatcher {
    constructor(container) {
        super();
        this.container = container;
        this.assets = new Map();
        this.categories = new Map();
        this.loaders = {
            texture: new TextureLoader(),
            audio: new AudioLoader(),
            file: new FileLoader()
        };
        
        this.initializeCategories();
        this.createUI();
    }
    
    initializeCategories() {
        // Initialize default asset categories
        this.categories.set('textures', {
            name: 'Textures',
            extensions: ['.png', '.jpg', '.jpeg', '.webp'],
            icon: 'mdi-image'
        });
        
        this.categories.set('models', {
            name: 'Models',
            extensions: ['.gltf', '.glb', '.fbx', '.obj'],
            icon: 'mdi-cube-outline'
        });
        
        this.categories.set('audio', {
            name: 'Audio',
            extensions: ['.mp3', '.wav', '.ogg'],
            icon: 'mdi-volume-high'
        });
        
        this.categories.set('scripts', {
            name: 'Scripts',
            extensions: ['.js'],
            icon: 'mdi-code-braces'
        });
        
        this.categories.set('materials', {
            name: 'Materials',
            extensions: ['.mat'],
            icon: 'mdi-palette'
        });
    }
    
    createUI() {
        // Clear container
        this.container.innerHTML = '';
        
        // Create toolbar
        const toolbar = document.createElement('div');
        toolbar.className = 'asset-browser-toolbar';
        toolbar.innerHTML = `
            <div class="search-box">
                <i class="mdi mdi-magnify"></i>
                <input type="text" placeholder="Search assets...">
            </div>
            <div class="toolbar-buttons">
                <button class="import-btn">
                    <i class="mdi mdi-upload"></i>
                    Import
                </button>
                <button class="create-btn">
                    <i class="mdi mdi-plus"></i>
                    Create
                </button>
            </div>
        `;
        this.container.appendChild(toolbar);
        
        // Create sidebar with categories
        const sidebar = document.createElement('div');
        sidebar.className = 'asset-browser-sidebar';
        
        let sidebarContent = '<ul class="category-list">';
        for (const [id, category] of this.categories) {
            sidebarContent += `
                <li data-category="${id}">
                    <i class="mdi ${category.icon}"></i>
                    ${category.name}
                    <span class="count">0</span>
                </li>
            `;
        }
        sidebarContent += '</ul>';
        sidebar.innerHTML = sidebarContent;
        this.container.appendChild(sidebar);
        
        // Create content area
        const content = document.createElement('div');
        content.className = 'asset-browser-content';
        this.container.appendChild(content);
        
        // Add event listeners
        this.setupEventListeners();
    }
    
    setupEventListeners() {
        // Search functionality
        const searchInput = this.container.querySelector('.search-box input');
        searchInput.addEventListener('input', (e) => {
            this.filterAssets(e.target.value);
        });
        
        // Import button
        const importBtn = this.container.querySelector('.import-btn');
        importBtn.addEventListener('click', () => {
            this.showImportDialog();
        });
        
        // Create button
        const createBtn = this.container.querySelector('.create-btn');
        createBtn.addEventListener('click', () => {
            this.showCreateDialog();
        });
        
        // Category selection
        const categories = this.container.querySelectorAll('.category-list li');
        categories.forEach(category => {
            category.addEventListener('click', (e) => {
                categories.forEach(c => c.classList.remove('active'));
                category.classList.add('active');
                this.filterByCategory(category.dataset.category);
            });
        });
    }
    
    showImportDialog() {
        const input = document.createElement('input');
        input.type = 'file';
        input.multiple = true;
        input.accept = Array.from(this.categories.values())
            .flatMap(cat => cat.extensions)
            .join(',');
            
        input.addEventListener('change', (e) => {
            this.importFiles(Array.from(e.target.files));
        });
        
        input.click();
    }
    
    showCreateDialog() {
        const dialog = document.createElement('div');
        dialog.className = 'create-asset-dialog';
        dialog.innerHTML = `
            <div class="dialog-content">
                <h2>Create New Asset</h2>
                <div class="asset-types">
                    <button data-type="material">
                        <i class="mdi mdi-palette"></i>
                        Material
                    </button>
                    <button data-type="script">
                        <i class="mdi mdi-code-braces"></i>
                        Script
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(dialog);
        
        dialog.querySelectorAll('button').forEach(btn => {
            btn.addEventListener('click', () => {
                this.createNewAsset(btn.dataset.type);
                dialog.remove();
            });
        });
    }
    
    async importFiles(files) {
        for (const file of files) {
            const extension = '.' + file.name.split('.').pop().toLowerCase();
            const category = this.getCategoryForExtension(extension);
            
            if (!category) {
                console.warn(`Unsupported file type: ${extension}`);
                continue;
            }
            
            try {
                const asset = await this.loadAsset(file, category);
                this.addAsset(asset);
            } catch (error) {
                console.error(`Error importing ${file.name}:`, error);
            }
        }
    }
    
    getCategoryForExtension(extension) {
        for (const [id, category] of this.categories) {
            if (category.extensions.includes(extension)) {
                return id;
            }
        }
        return null;
    }
    
    async loadAsset(file, category) {
        const reader = new FileReader();
        
        return new Promise((resolve, reject) => {
            reader.onload = async (e) => {
                try {
                    const asset = {
                        id: `asset_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
                        name: file.name,
                        category,
                        type: file.type,
                        size: file.size,
                        lastModified: file.lastModified,
                        url: URL.createObjectURL(file)
                    };
                    
                    // Load asset based on category
                    switch (category) {
                        case 'textures':
                            asset.data = await this.loaders.texture.loadAsync(asset.url);
                            break;
                        case 'audio':
                            asset.data = await this.loaders.audio.loadAsync(asset.url);
                            break;
                        default:
                            asset.data = e.target.result;
                    }
                    
                    resolve(asset);
                } catch (error) {
                    reject(error);
                }
            };
            
            reader.onerror = reject;
            reader.readAsArrayBuffer(file);
        });
    }
    
    addAsset(asset) {
        this.assets.set(asset.id, asset);
        this.updateUI();
        this.dispatchEvent({ type: 'assetAdded', asset });
    }
    
    removeAsset(assetId) {
        const asset = this.assets.get(assetId);
        if (asset) {
            // Cleanup asset data
            if (asset.url) {
                URL.revokeObjectURL(asset.url);
            }
            if (asset.data && asset.data.dispose) {
                asset.data.dispose();
            }
            
            this.assets.delete(assetId);
            this.updateUI();
            this.dispatchEvent({ type: 'assetRemoved', assetId });
        }
    }
    
    updateUI() {
        // Update category counts
        for (const [id, category] of this.categories) {
            const count = Array.from(this.assets.values())
                .filter(asset => asset.category === id)
                .length;
                
            const countElement = this.container.querySelector(`[data-category="${id}"] .count`);
            if (countElement) {
                countElement.textContent = count;
            }
        }
        
        // Update content area
        this.updateContentArea();
    }
    
    updateContentArea() {
        const content = this.container.querySelector('.asset-browser-content');
        const activeCategory = this.container.querySelector('.category-list li.active');
        const searchInput = this.container.querySelector('.search-box input');
        
        let assets = Array.from(this.assets.values());
        
        // Filter by category
        if (activeCategory) {
            const category = activeCategory.dataset.category;
            assets = assets.filter(asset => asset.category === category);
        }
        
        // Filter by search
        if (searchInput.value) {
            const search = searchInput.value.toLowerCase();
            assets = assets.filter(asset => 
                asset.name.toLowerCase().includes(search)
            );
        }
        
        // Render assets
        content.innerHTML = assets.map(asset => `
            <div class="asset-item" data-id="${asset.id}">
                <div class="asset-preview">
                    <i class="mdi ${this.categories.get(asset.category).icon}"></i>
                </div>
                <div class="asset-info">
                    <div class="asset-name">${asset.name}</div>
                    <div class="asset-meta">
                        ${this.formatSize(asset.size)}
                    </div>
                </div>
            </div>
        `).join('');
        
        // Add event listeners to asset items
        content.querySelectorAll('.asset-item').forEach(item => {
            item.addEventListener('click', () => {
                this.selectAsset(item.dataset.id);
            });
            
            item.addEventListener('contextmenu', (e) => {
                e.preventDefault();
                this.showAssetContextMenu(item.dataset.id, e);
            });
        });
    }
    
    selectAsset(assetId) {
        const asset = this.assets.get(assetId);
        if (asset) {
            this.dispatchEvent({ type: 'assetSelected', asset });
        }
    }
    
    showAssetContextMenu(assetId, event) {
        const menu = document.createElement('div');
        menu.className = 'context-menu';
        menu.style.left = `${event.clientX}px`;
        menu.style.top = `${event.clientY}px`;
        
        menu.innerHTML = `
            <ul>
                <li data-action="rename">Rename</li>
                <li data-action="delete">Delete</li>
            </ul>
        `;
        
        document.body.appendChild(menu);
        
        menu.querySelectorAll('li').forEach(item => {
            item.addEventListener('click', () => {
                switch (item.dataset.action) {
                    case 'rename':
                        this.renameAsset(assetId);
                        break;
                    case 'delete':
                        this.removeAsset(assetId);
                        break;
                }
                menu.remove();
            });
        });
        
        // Remove menu when clicking outside
        const removeMenu = () => {
            menu.remove();
            document.removeEventListener('click', removeMenu);
        };
        document.addEventListener('click', removeMenu);
    }
    
    renameAsset(assetId) {
        const asset = this.assets.get(assetId);
        if (!asset) return;
        
        const newName = prompt('Enter new name:', asset.name);
        if (newName && newName !== asset.name) {
            asset.name = newName;
            this.updateUI();
            this.dispatchEvent({ type: 'assetRenamed', asset });
        }
    }
    
    filterAssets(search) {
        this.updateUI();
    }
    
    filterByCategory(category) {
        this.updateUI();
    }
    
    formatSize(bytes) {
        const units = ['B', 'KB', 'MB', 'GB'];
        let size = bytes;
        let unit = 0;
        
        while (size >= 1024 && unit < units.length - 1) {
            size /= 1024;
            unit++;
        }
        
        return `${size.toFixed(1)} ${units[unit]}`;
    }
    
    dispose() {
        // Cleanup all assets
        for (const asset of this.assets.values()) {
            if (asset.url) {
                URL.revokeObjectURL(asset.url);
            }
            if (asset.data && asset.data.dispose) {
                asset.data.dispose();
            }
        }
        
        // Clear maps
        this.assets.clear();
        this.categories.clear();
        
        // Remove event listeners
        this.container.innerHTML = '';
    }
} 