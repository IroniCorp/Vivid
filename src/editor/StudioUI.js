import { Vector3, Euler } from 'three';

export class StudioUI {
    constructor(studio) {
        this.studio = studio;
        this.container = document.createElement('div');
        this.container.className = 'studio-ui';
        document.body.appendChild(this.container);

        this.setupStyles();
        this.createToolbar();
        this.createHierarchyPanel();
        this.createPropertiesPanel();
        this.createSidebar();
    }

    setupStyles() {
        const style = document.createElement('style');
        style.textContent = `
            .studio-ui {
                font-family: 'Arial', sans-serif;
                color: #ffffff;
            }

            .toolbar {
                position: fixed;
                top: 0;
                left: 50%;
                transform: translateX(-50%);
                background: #1a1a1a;
                border-radius: 0 0 8px 8px;
                padding: 8px;
                display: flex;
                gap: 8px;
                box-shadow: 0 2px 8px rgba(0,0,0,0.2);
                z-index: 1000;
            }

            .hierarchy-panel {
                position: fixed;
                left: 0;
                top: 0;
                width: 250px;
                height: 50%;
                background: #1a1a1a;
                padding: 16px;
                box-shadow: 2px 0 8px rgba(0,0,0,0.2);
                overflow-y: auto;
                z-index: 1000;
            }

            .properties-panel {
                position: fixed;
                left: 0;
                top: 50%;
                width: 250px;
                height: 50%;
                background: #1a1a1a;
                padding: 16px;
                box-shadow: 2px 0 8px rgba(0,0,0,0.2);
                overflow-y: auto;
                z-index: 1000;
            }

            .sidebar {
                position: fixed;
                right: 0;
                top: 0;
                width: 300px;
                height: 100%;
                background: #1a1a1a;
                padding: 16px;
                box-shadow: -2px 0 8px rgba(0,0,0,0.2);
                overflow-y: auto;
                z-index: 1000;
            }

            .button {
                background: #333;
                border: none;
                color: white;
                padding: 8px 16px;
                border-radius: 4px;
                cursor: pointer;
                transition: background 0.2s;
            }

            .button:hover {
                background: #444;
            }

            .button.active {
                background: #666;
            }

            .panel {
                background: #222;
                border-radius: 4px;
                padding: 12px;
                margin-bottom: 16px;
            }

            .panel-title {
                font-size: 14px;
                font-weight: bold;
                margin-bottom: 8px;
                color: #ddd;
                display: flex;
                justify-content: space-between;
                align-items: center;
            }

            .panel-title button {
                padding: 2px 6px;
                font-size: 12px;
            }

            .control-row {
                display: flex;
                align-items: center;
                margin-bottom: 8px;
                gap: 8px;
            }

            .label {
                flex: 1;
                font-size: 12px;
                color: #bbb;
            }

            .slider {
                flex: 2;
                width: 100%;
            }

            .checkbox {
                margin-right: 8px;
            }

            .vector-input {
                display: flex;
                gap: 4px;
            }

            .vector-input input {
                width: 60px;
                background: #333;
                border: 1px solid #444;
                color: white;
                padding: 4px;
                border-radius: 2px;
            }

            .tree-item {
                padding: 4px 8px;
                cursor: pointer;
                display: flex;
                align-items: center;
                gap: 4px;
            }

            .tree-item:hover {
                background: #333;
            }

            .tree-item.selected {
                background: #444;
            }

            .tree-item-children {
                margin-left: 16px;
            }

            .component-list {
                margin-top: 8px;
            }

            .component-item {
                background: #333;
                padding: 8px;
                margin-bottom: 4px;
                border-radius: 4px;
            }

            .add-component-button {
                width: 100%;
                margin-top: 8px;
                background: #2a2a2a;
                border: 1px dashed #444;
                color: #888;
                padding: 8px;
                cursor: pointer;
                border-radius: 4px;
            }

            .add-component-button:hover {
                background: #333;
                color: #fff;
            }
        `;
        document.head.appendChild(style);
    }

    createToolbar() {
        const toolbar = document.createElement('div');
        toolbar.className = 'toolbar';

        // Transform mode buttons
        const transformModes = ['translate', 'rotate', 'scale'];
        transformModes.forEach(mode => {
            const button = document.createElement('button');
            button.className = 'button';
            button.textContent = mode.charAt(0).toUpperCase() + mode.slice(1);
            button.onclick = () => {
                this.studio.setTransformMode(mode);
                toolbar.querySelectorAll('.button').forEach(b => b.classList.remove('active'));
                button.classList.add('active');
            };
            toolbar.appendChild(button);
        });

        // Space toggle
        const spaceButton = document.createElement('button');
        spaceButton.className = 'button';
        spaceButton.textContent = 'World';
        spaceButton.onclick = () => {
            const newSpace = spaceButton.textContent === 'World' ? 'local' : 'world';
            spaceButton.textContent = newSpace.charAt(0).toUpperCase() + newSpace.slice(1);
            this.studio.setTransformSpace(newSpace);
        };
        toolbar.appendChild(spaceButton);

        // Snap toggle
        const snapButton = document.createElement('button');
        snapButton.className = 'button';
        snapButton.textContent = 'Snap';
        snapButton.onclick = () => {
            const enabled = !snapButton.classList.contains('active');
            snapButton.classList.toggle('active');
            this.studio.setTransformSnap(enabled);
        };
        toolbar.appendChild(snapButton);

        this.container.appendChild(toolbar);
    }

    createHierarchyPanel() {
        const panel = document.createElement('div');
        panel.className = 'hierarchy-panel';

        const title = document.createElement('div');
        title.className = 'panel-title';
        title.textContent = 'Hierarchy';

        const addButton = document.createElement('button');
        addButton.className = 'button';
        addButton.textContent = '+';
        addButton.onclick = () => this.showAddObjectMenu();
        title.appendChild(addButton);

        panel.appendChild(title);

        this.hierarchyContent = document.createElement('div');
        panel.appendChild(this.hierarchyContent);

        this.container.appendChild(panel);
        this.updateHierarchy();
    }

    createPropertiesPanel() {
        const panel = document.createElement('div');
        panel.className = 'properties-panel';

        const title = document.createElement('div');
        title.className = 'panel-title';
        title.textContent = 'Properties';
        panel.appendChild(title);

        this.propertiesContent = document.createElement('div');
        panel.appendChild(this.propertiesContent);

        this.container.appendChild(panel);
    }

    updateHierarchy() {
        this.hierarchyContent.innerHTML = '';
        this.createHierarchyTree(this.studio.scene, this.hierarchyContent);
    }

    createHierarchyTree(object, container) {
        const item = document.createElement('div');
        item.className = 'tree-item';
        if (object === this.studio.transformControls.selectedObject) {
            item.classList.add('selected');
        }

        item.textContent = object.name || object.type;
        item.onclick = (e) => {
            e.stopPropagation();
            this.studio.selectObject(object);
            this.updateHierarchy();
            this.updateProperties(object);
        };

        container.appendChild(item);

        if (object.children && object.children.length > 0) {
            const childrenContainer = document.createElement('div');
            childrenContainer.className = 'tree-item-children';
            object.children.forEach(child => {
                this.createHierarchyTree(child, childrenContainer);
            });
            container.appendChild(childrenContainer);
        }
    }

    updateProperties(object) {
        this.propertiesContent.innerHTML = '';

        if (!object) return;

        // Transform properties
        const transformPanel = document.createElement('div');
        transformPanel.className = 'panel';

        // Position
        this.createVectorProperty(transformPanel, 'Position', object.position, (value) => {
            object.position.copy(value);
        });

        // Rotation
        this.createVectorProperty(transformPanel, 'Rotation', object.rotation, (value) => {
            object.rotation.set(value.x, value.y, value.z);
        }, true);

        // Scale
        this.createVectorProperty(transformPanel, 'Scale', object.scale, (value) => {
            object.scale.copy(value);
        });

        this.propertiesContent.appendChild(transformPanel);

        // Components
        const componentsPanel = document.createElement('div');
        componentsPanel.className = 'panel';
        const componentsTitle = document.createElement('div');
        componentsTitle.className = 'panel-title';
        componentsTitle.textContent = 'Components';
        componentsPanel.appendChild(componentsTitle);

        const componentList = document.createElement('div');
        componentList.className = 'component-list';

        // List existing components
        object.components?.forEach(component => {
            const componentItem = this.createComponentItem(component);
            componentList.appendChild(componentItem);
        });

        // Add component button
        const addComponentButton = document.createElement('button');
        addComponentButton.className = 'add-component-button';
        addComponentButton.textContent = '+ Add Component';
        addComponentButton.onclick = () => this.showAddComponentMenu(object);

        componentsPanel.appendChild(componentList);
        componentsPanel.appendChild(addComponentButton);
        this.propertiesContent.appendChild(componentsPanel);
    }

    createVectorProperty(container, label, vector, onChange, isRotation = false) {
        const row = document.createElement('div');
        row.className = 'control-row';

        const labelElement = document.createElement('div');
        labelElement.className = 'label';
        labelElement.textContent = label;

        const inputContainer = document.createElement('div');
        inputContainer.className = 'vector-input';

        ['x', 'y', 'z'].forEach(axis => {
            const input = document.createElement('input');
            input.type = 'number';
            input.step = isRotation ? '1' : '0.1';
            input.value = isRotation ? 
                (vector[axis] * 180 / Math.PI).toFixed(1) : 
                vector[axis].toFixed(3);

            input.onchange = () => {
                const value = new Vector3();
                inputContainer.querySelectorAll('input').forEach((input, i) => {
                    const v = parseFloat(input.value);
                    value[['x', 'y', 'z'][i]] = isRotation ? v * Math.PI / 180 : v;
                });
                onChange(value);
            };

            inputContainer.appendChild(input);
        });

        row.appendChild(labelElement);
        row.appendChild(inputContainer);
        container.appendChild(row);
    }

    createComponentItem(component) {
        const item = document.createElement('div');
        item.className = 'component-item';
        item.textContent = component.constructor.name;
        return item;
    }

    showAddObjectMenu() {
        const menu = document.createElement('div');
        menu.className = 'context-menu';
        menu.style.position = 'absolute';
        menu.style.background = '#1a1a1a';
        menu.style.border = '1px solid #333';
        menu.style.borderRadius = '4px';
        menu.style.padding = '4px';
        menu.style.zIndex = '1001';

        const options = ['Box', 'Sphere', 'Cylinder', 'Plane'];
        options.forEach(type => {
            const option = document.createElement('div');
            option.className = 'context-menu-item';
            option.style.padding = '8px';
            option.style.cursor = 'pointer';
            option.textContent = type;
            option.onmouseenter = () => option.style.background = '#333';
            option.onmouseleave = () => option.style.background = 'transparent';
            option.onclick = () => {
                this.studio.createObject(type);
                document.body.removeChild(menu);
            };
            menu.appendChild(option);
        });

        document.body.appendChild(menu);
        const rect = this.container.getBoundingClientRect();
        menu.style.left = `${rect.left + 250}px`;
        menu.style.top = `${rect.top + 50}px`;

        const closeMenu = (e) => {
            if (!menu.contains(e.target)) {
                document.body.removeChild(menu);
                document.removeEventListener('click', closeMenu);
            }
        };
        setTimeout(() => document.addEventListener('click', closeMenu), 0);
    }

    showAddComponentMenu(object) {
        const menu = document.createElement('div');
        menu.className = 'context-menu';
        menu.style.position = 'absolute';
        menu.style.background = '#1a1a1a';
        menu.style.border = '1px solid #333';
        menu.style.borderRadius = '4px';
        menu.style.padding = '4px';
        menu.style.zIndex = '1001';

        const components = ['RigidBody', 'Light', 'Camera', 'Audio', 'ParticleSystem'];
        components.forEach(type => {
            const option = document.createElement('div');
            option.className = 'context-menu-item';
            option.style.padding = '8px';
            option.style.cursor = 'pointer';
            option.textContent = type;
            option.onmouseenter = () => option.style.background = '#333';
            option.onmouseleave = () => option.style.background = 'transparent';
            option.onclick = () => {
                this.studio.addComponent(object, type);
                document.body.removeChild(menu);
                this.updateProperties(object);
            };
            menu.appendChild(option);
        });

        document.body.appendChild(menu);
        const rect = this.propertiesContent.getBoundingClientRect();
        menu.style.left = `${rect.left + 100}px`;
        menu.style.top = `${rect.bottom - 200}px`;

        const closeMenu = (e) => {
            if (!menu.contains(e.target)) {
                document.body.removeChild(menu);
                document.removeEventListener('click', closeMenu);
            }
        };
        setTimeout(() => document.addEventListener('click', closeMenu), 0);
    }

    createSidebar() {
        const sidebar = document.createElement('div');
        sidebar.className = 'sidebar';

        // Physics panel
        this.createPhysicsPanel(sidebar);

        // Post-processing panel
        this.createPostProcessingPanel(sidebar);

        // Audio panel
        this.createAudioPanel(sidebar);

        // Particle System panel
        this.createParticleSystemPanel(sidebar);

        this.container.appendChild(sidebar);
    }

    createPhysicsPanel(sidebar) {
        const panel = document.createElement('div');
        panel.className = 'panel';

        const title = document.createElement('div');
        title.className = 'panel-title';
        title.textContent = 'Physics';
        panel.appendChild(title);

        // Debug toggle
        const debugRow = document.createElement('div');
        debugRow.className = 'control-row';
        const debugLabel = document.createElement('label');
        debugLabel.className = 'label';
        debugLabel.textContent = 'Debug View';
        const debugCheckbox = document.createElement('input');
        debugCheckbox.type = 'checkbox';
        debugCheckbox.className = 'checkbox';
        debugCheckbox.checked = true;
        debugCheckbox.onchange = () => {
            this.studio.physics.setDebug(debugCheckbox.checked);
        };
        debugRow.appendChild(debugLabel);
        debugRow.appendChild(debugCheckbox);
        panel.appendChild(debugRow);

        // Gravity control
        const gravityRow = document.createElement('div');
        gravityRow.className = 'control-row';
        const gravityLabel = document.createElement('label');
        gravityLabel.className = 'label';
        gravityLabel.textContent = 'Gravity';
        const gravitySlider = document.createElement('input');
        gravitySlider.type = 'range';
        gravitySlider.className = 'slider';
        gravitySlider.min = -20;
        gravitySlider.max = 0;
        gravitySlider.step = 0.1;
        gravitySlider.value = -9.82;
        gravitySlider.onchange = () => {
            this.studio.physics.world.gravity.y = parseFloat(gravitySlider.value);
        };
        gravityRow.appendChild(gravityLabel);
        gravityRow.appendChild(gravitySlider);
        panel.appendChild(gravityRow);

        sidebar.appendChild(panel);
    }

    createPostProcessingPanel(sidebar) {
        const panel = document.createElement('div');
        panel.className = 'panel';

        const title = document.createElement('div');
        title.className = 'panel-title';
        title.textContent = 'Post Processing';
        panel.appendChild(title);

        // Bloom controls
        this.createEffectControls(panel, 'bloom', [
            { name: 'Threshold', param: 'Threshold', min: 0, max: 1, step: 0.1, default: 0.8 },
            { name: 'Intensity', param: 'Intensity', min: 0, max: 3, step: 0.1, default: 1.5 }
        ]);

        // FXAA toggle
        const fxaaRow = document.createElement('div');
        fxaaRow.className = 'control-row';
        const fxaaLabel = document.createElement('label');
        fxaaLabel.className = 'label';
        fxaaLabel.textContent = 'FXAA';
        const fxaaCheckbox = document.createElement('input');
        fxaaCheckbox.type = 'checkbox';
        fxaaCheckbox.className = 'checkbox';
        fxaaCheckbox.checked = true;
        fxaaCheckbox.onchange = () => {
            this.studio.enableEffect('fxaa', fxaaCheckbox.checked);
        };
        fxaaRow.appendChild(fxaaLabel);
        fxaaRow.appendChild(fxaaCheckbox);
        panel.appendChild(fxaaRow);

        // Vignette controls
        this.createEffectControls(panel, 'vignette', [
            { name: 'Offset', param: 'Offset', min: 0, max: 2, step: 0.1, default: 0.8 },
            { name: 'Darkness', param: 'Darkness', min: 0, max: 2, step: 0.1, default: 1.2 }
        ]);

        sidebar.appendChild(panel);
    }

    createAudioPanel(container) {
        const panel = document.createElement('div');
        panel.className = 'panel';

        const title = document.createElement('div');
        title.className = 'panel-title';
        title.textContent = 'Audio';
        panel.appendChild(title);

        // Audio Type
        const typeRow = document.createElement('div');
        typeRow.className = 'control-row';
        const typeLabel = document.createElement('div');
        typeLabel.className = 'label';
        typeLabel.textContent = 'Type';
        const typeSelect = document.createElement('select');
        typeSelect.innerHTML = `
            <option value="global">Global</option>
            <option value="positional">Positional</option>
        `;
        typeSelect.onchange = (e) => {
            const object = this.studio.transformControls.selectedObject;
            const audio = object?.getComponent?.('AudioComponent');
            if (audio) {
                audio.audioType = e.target.value;
            }
        };
        typeRow.appendChild(typeLabel);
        typeRow.appendChild(typeSelect);
        panel.appendChild(typeRow);

        // Volume
        const volumeRow = document.createElement('div');
        volumeRow.className = 'control-row';
        const volumeLabel = document.createElement('div');
        volumeLabel.className = 'label';
        volumeLabel.textContent = 'Volume';
        const volumeSlider = document.createElement('input');
        volumeSlider.type = 'range';
        volumeSlider.min = '0';
        volumeSlider.max = '1';
        volumeSlider.step = '0.1';
        volumeSlider.className = 'slider';
        volumeSlider.onchange = (e) => {
            const object = this.studio.transformControls.selectedObject;
            const audio = object?.getComponent?.('AudioComponent');
            if (audio) {
                audio.setVolume(parseFloat(e.target.value));
            }
        };
        volumeRow.appendChild(volumeLabel);
        volumeRow.appendChild(volumeSlider);
        panel.appendChild(volumeRow);

        // Loop
        const loopRow = document.createElement('div');
        loopRow.className = 'control-row';
        const loopLabel = document.createElement('div');
        loopLabel.className = 'label';
        loopLabel.textContent = 'Loop';
        const loopCheckbox = document.createElement('input');
        loopCheckbox.type = 'checkbox';
        loopCheckbox.className = 'checkbox';
        loopCheckbox.onchange = (e) => {
            const object = this.studio.transformControls.selectedObject;
            const audio = object?.getComponent?.('AudioComponent');
            if (audio) {
                audio.setLoop(e.target.checked);
            }
        };
        loopRow.appendChild(loopLabel);
        loopRow.appendChild(loopCheckbox);
        panel.appendChild(loopRow);

        // URL Input
        const urlRow = document.createElement('div');
        urlRow.className = 'control-row';
        const urlLabel = document.createElement('div');
        urlLabel.className = 'label';
        urlLabel.textContent = 'URL';
        const urlInput = document.createElement('input');
        urlInput.type = 'text';
        urlInput.placeholder = 'Audio file URL';
        urlInput.onchange = (e) => {
            const object = this.studio.transformControls.selectedObject;
            const audio = object?.getComponent?.('AudioComponent');
            if (audio) {
                audio.load(e.target.value);
            }
        };
        urlRow.appendChild(urlLabel);
        urlRow.appendChild(urlInput);
        panel.appendChild(urlRow);

        // Playback Controls
        const playbackRow = document.createElement('div');
        playbackRow.className = 'control-row';
        
        const playButton = document.createElement('button');
        playButton.className = 'button';
        playButton.textContent = 'Play';
        playButton.onclick = () => {
            const object = this.studio.transformControls.selectedObject;
            const audio = object?.getComponent?.('AudioComponent');
            if (audio) {
                audio.play();
            }
        };

        const pauseButton = document.createElement('button');
        pauseButton.className = 'button';
        pauseButton.textContent = 'Pause';
        pauseButton.onclick = () => {
            const object = this.studio.transformControls.selectedObject;
            const audio = object?.getComponent?.('AudioComponent');
            if (audio) {
                audio.pause();
            }
        };

        const stopButton = document.createElement('button');
        stopButton.className = 'button';
        stopButton.textContent = 'Stop';
        stopButton.onclick = () => {
            const object = this.studio.transformControls.selectedObject;
            const audio = object?.getComponent?.('AudioComponent');
            if (audio) {
                audio.stop();
            }
        };

        playbackRow.appendChild(playButton);
        playbackRow.appendChild(pauseButton);
        playbackRow.appendChild(stopButton);
        panel.appendChild(playbackRow);

        container.appendChild(panel);
    }

    createParticleSystemPanel(container) {
        const panel = document.createElement('div');
        panel.className = 'panel';

        const title = document.createElement('div');
        title.className = 'panel-title';
        title.textContent = 'Particle System';
        panel.appendChild(title);

        // Emission Rate
        const emissionRow = document.createElement('div');
        emissionRow.className = 'control-row';
        const emissionLabel = document.createElement('div');
        emissionLabel.className = 'label';
        emissionLabel.textContent = 'Emission Rate';
        const emissionSlider = document.createElement('input');
        emissionSlider.type = 'range';
        emissionSlider.min = '0';
        emissionSlider.max = '200';
        emissionSlider.step = '1';
        emissionSlider.className = 'slider';
        emissionSlider.value = '50';
        emissionSlider.onchange = (e) => {
            const object = this.studio.transformControls.selectedObject;
            const particles = object?.getComponent?.('ParticleSystem');
            if (particles) {
                particles.setEmissionRate(parseFloat(e.target.value));
            }
        };
        emissionRow.appendChild(emissionLabel);
        emissionRow.appendChild(emissionSlider);
        panel.appendChild(emissionRow);

        // Particle Size
        const sizeRow = document.createElement('div');
        sizeRow.className = 'control-row';
        const sizeLabel = document.createElement('div');
        sizeLabel.className = 'label';
        sizeLabel.textContent = 'Particle Size';
        const sizeSlider = document.createElement('input');
        sizeSlider.type = 'range';
        sizeSlider.min = '0.01';
        sizeSlider.max = '1';
        sizeSlider.step = '0.01';
        sizeSlider.className = 'slider';
        sizeSlider.value = '0.1';
        sizeSlider.onchange = (e) => {
            const object = this.studio.transformControls.selectedObject;
            const particles = object?.getComponent?.('ParticleSystem');
            if (particles) {
                particles.setParticleSize(parseFloat(e.target.value));
            }
        };
        sizeRow.appendChild(sizeLabel);
        sizeRow.appendChild(sizeSlider);
        panel.appendChild(sizeRow);

        // Lifetime
        const lifetimeRow = document.createElement('div');
        lifetimeRow.className = 'control-row';
        const lifetimeLabel = document.createElement('div');
        lifetimeLabel.className = 'label';
        lifetimeLabel.textContent = 'Lifetime';
        const lifetimeSlider = document.createElement('input');
        lifetimeSlider.type = 'range';
        lifetimeSlider.min = '0.1';
        lifetimeSlider.max = '10';
        lifetimeSlider.step = '0.1';
        lifetimeSlider.className = 'slider';
        lifetimeSlider.value = '2';
        lifetimeSlider.onchange = (e) => {
            const object = this.studio.transformControls.selectedObject;
            const particles = object?.getComponent?.('ParticleSystem');
            if (particles) {
                particles.options.lifetime = parseFloat(e.target.value);
            }
        };
        lifetimeRow.appendChild(lifetimeLabel);
        lifetimeRow.appendChild(lifetimeSlider);
        panel.appendChild(lifetimeRow);

        // Start Color
        const startColorRow = document.createElement('div');
        startColorRow.className = 'control-row';
        const startColorLabel = document.createElement('div');
        startColorLabel.className = 'label';
        startColorLabel.textContent = 'Start Color';
        const startColorInput = document.createElement('input');
        startColorInput.type = 'color';
        startColorInput.value = '#ffffff';
        startColorInput.onchange = (e) => {
            const object = this.studio.transformControls.selectedObject;
            const particles = object?.getComponent?.('ParticleSystem');
            if (particles) {
                particles.setStartColor(new Color(e.target.value));
            }
        };
        startColorRow.appendChild(startColorLabel);
        startColorRow.appendChild(startColorInput);
        panel.appendChild(startColorRow);

        // End Color
        const endColorRow = document.createElement('div');
        endColorRow.className = 'control-row';
        const endColorLabel = document.createElement('div');
        endColorLabel.className = 'label';
        endColorLabel.textContent = 'End Color';
        const endColorInput = document.createElement('input');
        endColorInput.type = 'color';
        endColorInput.value = '#ffff00';
        endColorInput.onchange = (e) => {
            const object = this.studio.transformControls.selectedObject;
            const particles = object?.getComponent?.('ParticleSystem');
            if (particles) {
                particles.setEndColor(new Color(e.target.value));
            }
        };
        endColorRow.appendChild(endColorLabel);
        endColorRow.appendChild(endColorInput);
        panel.appendChild(endColorRow);

        // Loop
        const loopRow = document.createElement('div');
        loopRow.className = 'control-row';
        const loopLabel = document.createElement('div');
        loopLabel.className = 'label';
        loopLabel.textContent = 'Loop';
        const loopCheckbox = document.createElement('input');
        loopCheckbox.type = 'checkbox';
        loopCheckbox.className = 'checkbox';
        loopCheckbox.checked = true;
        loopCheckbox.onchange = (e) => {
            const object = this.studio.transformControls.selectedObject;
            const particles = object?.getComponent?.('ParticleSystem');
            if (particles) {
                particles.setLoop(e.target.checked);
            }
        };
        loopRow.appendChild(loopLabel);
        loopRow.appendChild(loopCheckbox);
        panel.appendChild(loopRow);

        // Playback Controls
        const playbackRow = document.createElement('div');
        playbackRow.className = 'control-row';
        
        const playButton = document.createElement('button');
        playButton.className = 'button';
        playButton.textContent = 'Play';
        playButton.onclick = () => {
            const object = this.studio.transformControls.selectedObject;
            const particles = object?.getComponent?.('ParticleSystem');
            if (particles) {
                particles.play();
            }
        };

        const pauseButton = document.createElement('button');
        pauseButton.className = 'button';
        pauseButton.textContent = 'Pause';
        pauseButton.onclick = () => {
            const object = this.studio.transformControls.selectedObject;
            const particles = object?.getComponent?.('ParticleSystem');
            if (particles) {
                particles.pause();
            }
        };

        const stopButton = document.createElement('button');
        stopButton.className = 'button';
        stopButton.textContent = 'Stop';
        stopButton.onclick = () => {
            const object = this.studio.transformControls.selectedObject;
            const particles = object?.getComponent?.('ParticleSystem');
            if (particles) {
                particles.stop();
            }
        };

        playbackRow.appendChild(playButton);
        playbackRow.appendChild(pauseButton);
        playbackRow.appendChild(stopButton);
        panel.appendChild(playbackRow);

        container.appendChild(panel);
    }

    createEffectControls(panel, effectName, controls) {
        const container = document.createElement('div');
        container.style.marginBottom = '12px';

        // Effect toggle
        const toggleRow = document.createElement('div');
        toggleRow.className = 'control-row';
        const toggleLabel = document.createElement('label');
        toggleLabel.className = 'label';
        toggleLabel.textContent = effectName.charAt(0).toUpperCase() + effectName.slice(1);
        const toggleCheckbox = document.createElement('input');
        toggleCheckbox.type = 'checkbox';
        toggleCheckbox.className = 'checkbox';
        toggleCheckbox.checked = true;
        toggleCheckbox.onchange = () => {
            this.studio.enableEffect(effectName, toggleCheckbox.checked);
        };
        toggleRow.appendChild(toggleLabel);
        toggleRow.appendChild(toggleCheckbox);
        container.appendChild(toggleRow);

        // Effect parameters
        controls.forEach(control => {
            const row = document.createElement('div');
            row.className = 'control-row';
            const label = document.createElement('label');
            label.className = 'label';
            label.textContent = control.name;
            const slider = document.createElement('input');
            slider.type = 'range';
            slider.className = 'slider';
            slider.min = control.min;
            slider.max = control.max;
            slider.step = control.step;
            slider.value = control.default;
            slider.onchange = () => {
                this.studio.setEffectParameter(effectName, control.param, parseFloat(slider.value));
            };
            row.appendChild(label);
            row.appendChild(slider);
            container.appendChild(row);
        });

        panel.appendChild(container);
    }

    dispose() {
        this.container.remove();
    }
} 