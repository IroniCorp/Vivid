import { EventDispatcher } from 'three';

/**
 * Visual Scripting system for Vivid Engine
 * Allows creating behaviors using a node-based interface
 */
export class VisualScripting extends EventDispatcher {
    constructor(scene) {
        super();
        this.scene = scene;
        this.graphs = new Map(); // Map of object UUID to behavior graph
        this.nodeTypes = new Map(); // Available node types
        this.activeGraph = null;
        this.isPlaying = false;
        
        this.registerDefaultNodes();
    }
    
    /**
     * Register built-in node types
     */
    registerDefaultNodes() {
        // Event nodes
        this.registerNodeType('OnStart', {
            category: 'Events',
            inputs: [],
            outputs: ['Next'],
            execute: (node, context) => {
                // Triggered when graph starts
                return { flow: 'Next' };
            }
        });
        
        this.registerNodeType('OnUpdate', {
            category: 'Events',
            inputs: [],
            outputs: ['Next'],
            properties: {
                deltaTime: { type: 'float', value: 0, output: true }
            },
            execute: (node, context) => {
                node.properties.deltaTime = context.deltaTime;
                return { flow: 'Next' };
            }
        });
        
        this.registerNodeType('OnCollision', {
            category: 'Events',
            inputs: [],
            outputs: ['Next'],
            properties: {
                otherObject: { type: 'object', value: null, output: true }
            },
            execute: (node, context) => {
                if (context.collisionEvent) {
                    node.properties.otherObject = context.collisionEvent.other;
                    return { flow: 'Next' };
                }
                return null;
            }
        });
        
        // Logic nodes
        this.registerNodeType('Branch', {
            category: 'Logic',
            inputs: ['Exec', 'Condition'],
            outputs: ['True', 'False'],
            execute: (node, context) => {
                const condition = node.getInputValue('Condition');
                return { flow: condition ? 'True' : 'False' };
            }
        });
        
        this.registerNodeType('Sequence', {
            category: 'Logic',
            inputs: ['Exec'],
            outputs: ['First', 'Second', 'Third'],
            execute: (node, context) => {
                // Execute outputs in sequence
                return { 
                    multiFlow: ['First', 'Second', 'Third'],
                    sequential: true
                };
            }
        });
        
        // Math nodes
        this.registerNodeType('Add', {
            category: 'Math',
            inputs: ['A', 'B'],
            outputs: ['Result'],
            properties: {
                A: { type: 'float', value: 0, input: true },
                B: { type: 'float', value: 0, input: true },
                Result: { type: 'float', value: 0, output: true }
            },
            execute: (node, context) => {
                const a = node.getInputValue('A') || 0;
                const b = node.getInputValue('B') || 0;
                node.properties.Result = a + b;
                return { values: { Result: a + b } };
            }
        });
        
        this.registerNodeType('Multiply', {
            category: 'Math',
            inputs: ['A', 'B'],
            outputs: ['Result'],
            properties: {
                A: { type: 'float', value: 0, input: true },
                B: { type: 'float', value: 0, input: true },
                Result: { type: 'float', value: 0, output: true }
            },
            execute: (node, context) => {
                const a = node.getInputValue('A') || 0;
                const b = node.getInputValue('B') || 0;
                node.properties.Result = a * b;
                return { values: { Result: a * b } };
            }
        });
        
        // Transform nodes
        this.registerNodeType('GetPosition', {
            category: 'Transform',
            inputs: ['Object'],
            outputs: ['Position', 'X', 'Y', 'Z'],
            properties: {
                Object: { type: 'object', value: null, input: true },
                X: { type: 'float', value: 0, output: true },
                Y: { type: 'float', value: 0, output: true },
                Z: { type: 'float', value: 0, output: true }
            },
            execute: (node, context) => {
                const object = node.getInputValue('Object') || context.object;
                if (object && object.position) {
                    node.properties.X = object.position.x;
                    node.properties.Y = object.position.y;
                    node.properties.Z = object.position.z;
                    return { 
                        values: { 
                            Position: object.position.clone(),
                            X: object.position.x,
                            Y: object.position.y,
                            Z: object.position.z
                        } 
                    };
                }
                return { values: { Position: null, X: 0, Y: 0, Z: 0 } };
            }
        });
        
        this.registerNodeType('SetPosition', {
            category: 'Transform',
            inputs: ['Exec', 'Object', 'Position', 'X', 'Y', 'Z'],
            outputs: ['Next'],
            properties: {
                Object: { type: 'object', value: null, input: true },
                X: { type: 'float', value: 0, input: true },
                Y: { type: 'float', value: 0, input: true },
                Z: { type: 'float', value: 0, input: true }
            },
            execute: (node, context) => {
                const object = node.getInputValue('Object') || context.object;
                const position = node.getInputValue('Position');
                const x = node.getInputValue('X') || 0;
                const y = node.getInputValue('Y') || 0;
                const z = node.getInputValue('Z') || 0;
                
                if (object && object.position) {
                    if (position) {
                        object.position.copy(position);
                    } else {
                        object.position.set(x, y, z);
                    }
                }
                
                return { flow: 'Next' };
            }
        });
        
        // Physics nodes
        this.registerNodeType('ApplyForce', {
            category: 'Physics',
            inputs: ['Exec', 'Object', 'Force', 'ForceX', 'ForceY', 'ForceZ'],
            outputs: ['Next'],
            properties: {
                Object: { type: 'object', value: null, input: true },
                ForceX: { type: 'float', value: 0, input: true },
                ForceY: { type: 'float', value: 0, input: true },
                ForceZ: { type: 'float', value: 0, input: true }
            },
            execute: (node, context) => {
                const object = node.getInputValue('Object') || context.object;
                const force = node.getInputValue('Force');
                const forceX = node.getInputValue('ForceX') || 0;
                const forceY = node.getInputValue('ForceY') || 0;
                const forceZ = node.getInputValue('ForceZ') || 0;
                
                if (object) {
                    const rigidBody = object.getComponent('RigidBody');
                    if (rigidBody) {
                        if (force) {
                            rigidBody.applyForce(force);
                        } else {
                            rigidBody.applyForce({ x: forceX, y: forceY, z: forceZ });
                        }
                    }
                }
                
                return { flow: 'Next' };
            }
        });
    }
    
    /**
     * Register a new node type
     * @param {string} typeName - Name of the node type
     * @param {object} definition - Node definition
     */
    registerNodeType(typeName, definition) {
        this.nodeTypes.set(typeName, definition);
    }
    
    /**
     * Create a new behavior graph for an object
     * @param {Object3D} object - The object to attach the graph to
     * @returns {object} The created graph
     */
    createGraph(object) {
        const graph = {
            id: object.uuid,
            objectId: object.uuid,
            nodes: [],
            connections: [],
            variables: new Map()
        };
        
        this.graphs.set(object.uuid, graph);
        return graph;
    }
    
    /**
     * Add a node to a graph
     * @param {string} graphId - ID of the graph
     * @param {string} nodeType - Type of node to add
     * @param {object} position - Position in the editor
     * @returns {object} The created node
     */
    addNode(graphId, nodeType, position = { x: 0, y: 0 }) {
        const graph = this.graphs.get(graphId);
        if (!graph) return null;
        
        const nodeDefinition = this.nodeTypes.get(nodeType);
        if (!nodeDefinition) return null;
        
        const nodeId = `node_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
        const node = {
            id: nodeId,
            type: nodeType,
            position: position,
            properties: JSON.parse(JSON.stringify(nodeDefinition.properties || {})),
            getInputValue: function(inputName) {
                // Implementation to get input value from connected nodes
                return this.properties[inputName]?.value;
            }
        };
        
        graph.nodes.push(node);
        return node;
    }
    
    /**
     * Connect two nodes in a graph
     * @param {string} graphId - ID of the graph
     * @param {string} sourceNodeId - ID of the source node
     * @param {string} sourceOutput - Output name on the source node
     * @param {string} targetNodeId - ID of the target node
     * @param {string} targetInput - Input name on the target node
     * @returns {object} The created connection
     */
    connectNodes(graphId, sourceNodeId, sourceOutput, targetNodeId, targetInput) {
        const graph = this.graphs.get(graphId);
        if (!graph) return null;
        
        const connection = {
            id: `conn_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
            sourceNodeId,
            sourceOutput,
            targetNodeId,
            targetInput
        };
        
        graph.connections.push(connection);
        return connection;
    }
    
    /**
     * Execute a graph
     * @param {string} graphId - ID of the graph to execute
     * @param {object} context - Execution context
     */
    executeGraph(graphId, context = {}) {
        const graph = this.graphs.get(graphId);
        if (!graph || !this.isPlaying) return;
        
        // Find start nodes (typically OnStart, OnUpdate, etc.)
        const eventNodes = graph.nodes.filter(node => 
            this.nodeTypes.get(node.type)?.category === 'Events'
        );
        
        // Execute each event node
        for (const eventNode of eventNodes) {
            this.executeNode(graph, eventNode, context);
        }
    }
    
    /**
     * Execute a single node and follow execution flow
     * @param {object} graph - The graph containing the node
     * @param {object} node - The node to execute
     * @param {object} context - Execution context
     */
    executeNode(graph, node, context) {
        const nodeType = this.nodeTypes.get(node.type);
        if (!nodeType || !nodeType.execute) return;
        
        // Execute the node
        const result = nodeType.execute(node, context);
        if (!result) return;
        
        // Follow execution flow
        if (result.flow) {
            const connections = graph.connections.filter(conn => 
                conn.sourceNodeId === node.id && conn.sourceOutput === result.flow
            );
            
            for (const connection of connections) {
                const targetNode = graph.nodes.find(n => n.id === connection.targetNodeId);
                if (targetNode) {
                    this.executeNode(graph, targetNode, context);
                }
            }
        }
        
        // Handle multiple flows (for sequence nodes, etc.)
        if (result.multiFlow) {
            for (const flow of result.multiFlow) {
                const connections = graph.connections.filter(conn => 
                    conn.sourceNodeId === node.id && conn.sourceOutput === flow
                );
                
                for (const connection of connections) {
                    const targetNode = graph.nodes.find(n => n.id === connection.targetNodeId);
                    if (targetNode) {
                        this.executeNode(graph, targetNode, context);
                        
                        // If sequential, only execute the first valid connection then return
                        if (result.sequential) return;
                    }
                }
            }
        }
        
        // Propagate values to connected nodes
        if (result.values) {
            for (const [outputName, value] of Object.entries(result.values)) {
                const connections = graph.connections.filter(conn => 
                    conn.sourceNodeId === node.id && conn.sourceOutput === outputName
                );
                
                for (const connection of connections) {
                    const targetNode = graph.nodes.find(n => n.id === connection.targetNodeId);
                    if (targetNode && targetNode.properties && targetNode.properties[connection.targetInput]) {
                        targetNode.properties[connection.targetInput].value = value;
                    }
                }
            }
        }
    }
    
    /**
     * Start executing all graphs
     */
    play() {
        this.isPlaying = true;
        this.dispatchEvent({ type: 'play' });
    }
    
    /**
     * Stop executing all graphs
     */
    stop() {
        this.isPlaying = false;
        this.dispatchEvent({ type: 'stop' });
    }
    
    /**
     * Update all graphs (called every frame)
     * @param {number} deltaTime - Time since last frame in seconds
     */
    update(deltaTime) {
        if (!this.isPlaying) return;
        
        // Execute all graphs with update context
        for (const [objectId, graph] of this.graphs.entries()) {
            const object = this.scene.getObjectByProperty('uuid', objectId);
            if (object) {
                this.executeGraph(objectId, { 
                    deltaTime, 
                    object,
                    time: performance.now() / 1000
                });
            }
        }
    }
    
    /**
     * Serialize a graph to JSON
     * @param {string} graphId - ID of the graph to serialize
     * @returns {string} JSON string
     */
    serializeGraph(graphId) {
        const graph = this.graphs.get(graphId);
        if (!graph) return null;
        
        return JSON.stringify({
            id: graph.id,
            objectId: graph.objectId,
            nodes: graph.nodes.map(node => ({
                id: node.id,
                type: node.type,
                position: node.position,
                properties: Object.fromEntries(
                    Object.entries(node.properties || {}).map(([key, prop]) => [key, prop.value])
                )
            })),
            connections: graph.connections,
            variables: Array.from(graph.variables.entries())
        });
    }
    
    /**
     * Deserialize a graph from JSON
     * @param {string} json - JSON string
     * @returns {object} The deserialized graph
     */
    deserializeGraph(json) {
        try {
            const data = JSON.parse(json);
            const graph = {
                id: data.id,
                objectId: data.objectId,
                nodes: data.nodes.map(nodeData => {
                    const nodeType = this.nodeTypes.get(nodeData.type);
                    const properties = {};
                    
                    // Restore properties with their full definition
                    if (nodeType && nodeType.properties) {
                        for (const [key, propDef] of Object.entries(nodeType.properties)) {
                            properties[key] = { ...propDef };
                            if (nodeData.properties && nodeData.properties[key] !== undefined) {
                                properties[key].value = nodeData.properties[key];
                            }
                        }
                    }
                    
                    return {
                        id: nodeData.id,
                        type: nodeData.type,
                        position: nodeData.position,
                        properties,
                        getInputValue: function(inputName) {
                            return this.properties[inputName]?.value;
                        }
                    };
                }),
                connections: data.connections,
                variables: new Map(data.variables)
            };
            
            this.graphs.set(graph.id, graph);
            return graph;
        } catch (error) {
            console.error('Error deserializing graph:', error);
            return null;
        }
    }
} 