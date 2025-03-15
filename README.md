# Vivid Engine

A modern, component-based WebGL 3D engine built with Three.js, featuring a powerful editor interface.

![Vivid Engine](screenshot.png)

## Features

### Core Engine
- **Component System**: Flexible entity-component architecture
- **Physics**: Integrated physics simulation with collision detection
- **Audio**: Spatial audio system with 3D positioning
- **Particle System**: GPU-accelerated particle effects
- **Post-Processing**: Real-time visual effects pipeline

### Editor
- **Scene Hierarchy**: Intuitive object management
- **Transform Controls**: Precise object manipulation
- **Component Editor**: Easy component addition and configuration
- **Physics Debug**: Visual physics debugging
- **Particle Editor**: Real-time particle system editing
- **Audio Controls**: Audio playback and spatial configuration

### Components
- **Transform**: Position, rotation, and scale
- **RigidBody**: Physics simulation
- **Audio**: Spatial and global audio
- **ParticleSystem**: Visual effects
- **Light**: Various light types
- **Camera**: Multiple camera support

### Visual Effects
- **Bloom**: HDR bloom effect
- **FXAA**: Anti-aliasing
- **Vignette**: Screen edge darkening

## Getting Started

### Prerequisites
- Node.js 14.0 or higher
- npm or yarn

### Installation
```bash
# Clone the repository
git clone https://github.com/yourusername/vivid-engine.git

# Navigate to project directory
cd vivid-engine

# Install dependencies
npm install

# Start development server
npm run dev
```

### Basic Usage
1. Open the editor in your browser (default: http://localhost:3000)
2. Add objects using the '+' button in the Hierarchy panel
3. Add components using the 'Add Component' button in the Properties panel
4. Manipulate objects using the transform tools (W: Translate, E: Rotate, R: Scale)

## Keyboard Shortcuts
- `W`: Translate mode
- `E`: Rotate mode
- `R`: Scale mode
- `X`: Toggle world/local space
- `V`: Toggle snap
- `F`: Focus selected object
- `Delete`: Remove selected object

## Component Guide

### RigidBody
```javascript
// Add physics to an object
const body = object.addComponent('RigidBody', {
    mass: 1,
    shape: 'box',
    size: new Vector3(1, 1, 1)
});
```

### Audio
```javascript
// Add spatial audio
const audio = object.addComponent('Audio', {
    positional: true,
    url: 'sound.mp3',
    volume: 1.0,
    loop: true
});
```

### ParticleSystem
```javascript
// Create a particle effect
const particles = object.addComponent('ParticleSystem', {
    maxParticles: 1000,
    emissionRate: 50,
    lifetime: 2,
    startColor: new Color(1, 1, 1),
    endColor: new Color(1, 1, 0)
});
```

## Contributing
1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments
- Built with [Three.js](https://threejs.org/)
- Physics powered by [Cannon.js](https://github.com/schteppe/cannon.js)
- Development tools by [Vite](https://vitejs.dev/) 