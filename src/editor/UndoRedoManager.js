import { EventDispatcher } from 'three';

export class UndoRedoManager extends EventDispatcher {
    constructor() {
        super();
        this.undoStack = [];
        this.redoStack = [];
        this.maxStackSize = 50;
        this.isExecutingAction = false;
    }
    
    /**
     * Add an action to the undo stack
     * @param {object} action - The action to add
     */
    addAction(action) {
        if (!action || !action.execute || !action.undo) {
            console.warn('Invalid action:', action);
            return;
        }
        
        // Clear redo stack when a new action is added
        if (!this.isExecutingAction) {
            this.redoStack = [];
        }
        
        // Add action to undo stack
        this.undoStack.push(action);
        
        // Limit stack size
        if (this.undoStack.length > this.maxStackSize) {
            this.undoStack.shift();
        }
        
        this.dispatchEvent({ type: 'stackChanged' });
    }
    
    /**
     * Create and add a transform action
     * @param {Object3D} object - The object being transformed
     * @param {string} property - The property being changed (position, rotation, scale)
     * @param {Vector3} oldValue - The old value
     * @param {Vector3} newValue - The new value
     */
    addTransformAction(object, property, oldValue, newValue) {
        const action = {
            name: `Transform ${object.name || object.uuid} ${property}`,
            execute: () => {
                object[property].copy(newValue);
            },
            undo: () => {
                object[property].copy(oldValue);
            }
        };
        
        this.addAction(action);
    }
    
    /**
     * Create and add an add object action
     * @param {Object3D} object - The object being added
     * @param {Scene} scene - The scene
     */
    addAddObjectAction(object, scene) {
        const action = {
            name: `Add ${object.name || object.uuid}`,
            execute: () => {
                scene.add(object);
            },
            undo: () => {
                scene.remove(object);
            }
        };
        
        this.addAction(action);
    }
    
    /**
     * Create and add a remove object action
     * @param {Object3D} object - The object being removed
     * @param {Scene} scene - The scene
     */
    addRemoveObjectAction(object, scene) {
        const action = {
            name: `Remove ${object.name || object.uuid}`,
            execute: () => {
                scene.remove(object);
            },
            undo: () => {
                scene.add(object);
            }
        };
        
        this.addAction(action);
    }
    
    /**
     * Create and add a material change action
     * @param {Object3D} object - The object whose material is changing
     * @param {Material} oldMaterial - The old material
     * @param {Material} newMaterial - The new material
     */
    addMaterialAction(object, oldMaterial, newMaterial) {
        const action = {
            name: `Change material of ${object.name || object.uuid}`,
            execute: () => {
                object.material = newMaterial;
            },
            undo: () => {
                object.material = oldMaterial;
            }
        };
        
        this.addAction(action);
    }
    
    /**
     * Create and add a component action
     * @param {Object3D} object - The object the component is being added to/removed from
     * @param {string} componentType - The type of component
     * @param {object} componentData - The component data
     * @param {boolean} isAdd - Whether this is an add or remove action
     */
    addComponentAction(object, componentType, componentData, isAdd) {
        const action = {
            name: `${isAdd ? 'Add' : 'Remove'} ${componentType} component to ${object.name || object.uuid}`,
            execute: () => {
                if (isAdd) {
                    object.addComponent(componentType, componentData);
                } else {
                    object.removeComponent(componentType);
                }
            },
            undo: () => {
                if (isAdd) {
                    object.removeComponent(componentType);
                } else {
                    object.addComponent(componentType, componentData);
                }
            }
        };
        
        this.addAction(action);
    }
    
    /**
     * Create and add a property change action
     * @param {object} target - The object whose property is changing
     * @param {string} property - The property name
     * @param {any} oldValue - The old value
     * @param {any} newValue - The new value
     */
    addPropertyAction(target, property, oldValue, newValue) {
        const action = {
            name: `Change ${property}`,
            execute: () => {
                target[property] = newValue;
            },
            undo: () => {
                target[property] = oldValue;
            }
        };
        
        this.addAction(action);
    }
    
    /**
     * Undo the last action
     */
    undo() {
        const action = this.undoStack.pop();
        if (action) {
            this.isExecutingAction = true;
            
            try {
                action.undo();
                this.redoStack.push(action);
                
                // Limit redo stack size
                if (this.redoStack.length > this.maxStackSize) {
                    this.redoStack.shift();
                }
            } catch (error) {
                console.error('Error undoing action:', error);
            }
            
            this.isExecutingAction = false;
            this.dispatchEvent({ type: 'stackChanged' });
        }
    }
    
    /**
     * Redo the last undone action
     */
    redo() {
        const action = this.redoStack.pop();
        if (action) {
            this.isExecutingAction = true;
            
            try {
                action.execute();
                this.undoStack.push(action);
                
                // Limit undo stack size
                if (this.undoStack.length > this.maxStackSize) {
                    this.undoStack.shift();
                }
            } catch (error) {
                console.error('Error redoing action:', error);
            }
            
            this.isExecutingAction = false;
            this.dispatchEvent({ type: 'stackChanged' });
        }
    }
    
    /**
     * Clear both undo and redo stacks
     */
    clear() {
        this.undoStack = [];
        this.redoStack = [];
        this.dispatchEvent({ type: 'stackChanged' });
    }
    
    /**
     * Check if there are actions that can be undone
     * @returns {boolean} Whether there are actions to undo
     */
    canUndo() {
        return this.undoStack.length > 0;
    }
    
    /**
     * Check if there are actions that can be redone
     * @returns {boolean} Whether there are actions to redo
     */
    canRedo() {
        return this.redoStack.length > 0;
    }
    
    /**
     * Get the name of the next action that would be undone
     * @returns {string|null} The name of the next undo action, or null if none
     */
    getNextUndoActionName() {
        const action = this.undoStack[this.undoStack.length - 1];
        return action ? action.name : null;
    }
    
    /**
     * Get the name of the next action that would be redone
     * @returns {string|null} The name of the next redo action, or null if none
     */
    getNextRedoActionName() {
        const action = this.redoStack[this.redoStack.length - 1];
        return action ? action.name : null;
    }
    
    /**
     * Start a compound action (multiple actions that should be undone/redone together)
     * @param {string} name - Name of the compound action
     */
    startCompoundAction(name) {
        const compoundAction = {
            name,
            actions: [],
            execute: () => {
                for (const action of compoundAction.actions) {
                    action.execute();
                }
            },
            undo: () => {
                for (const action of compoundAction.actions.slice().reverse()) {
                    action.undo();
                }
            }
        };
        
        this.currentCompoundAction = compoundAction;
    }
    
    /**
     * End the current compound action and add it to the undo stack
     */
    endCompoundAction() {
        if (this.currentCompoundAction) {
            if (this.currentCompoundAction.actions.length > 0) {
                this.addAction(this.currentCompoundAction);
            }
            this.currentCompoundAction = null;
        }
    }
    
    /**
     * Add an action to the current compound action
     * @param {object} action - The action to add
     */
    addToCompoundAction(action) {
        if (this.currentCompoundAction) {
            this.currentCompoundAction.actions.push(action);
        } else {
            this.addAction(action);
        }
    }
} 