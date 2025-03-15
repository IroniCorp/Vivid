# 🌟 Vivid Engine

A powerful, modern WebGL 2.0 3D engine designed for high-performance graphics and visual effects in web browsers.

![Vivid Engine](/assets/banner.png)
![Screenshot](/assets/screenshot.png)

[![GitHub stars](https://img.shields.io/github/stars/manugeni/vivid-engine.svg?style=social&label=Star&maxAge=2592000)](https://github.com/manugeni/vivid-engine/stargazers/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Twitter Follow](https://img.shields.io/twitter/follow/callmerendani.svg?style=social)](https://twitter.com/callmerendani)

## ✨ Features

### Current Features
- 🚀 WebGL 2.0 based rendering pipeline
- 📦 Efficient entity management system
- 🎨 PBR (Physically Based Rendering) materials
- 💡 Advanced lighting system (Point, Directional, Spot lights)
- 🌈 Post-processing effects (Bloom, FXAA, Vignette)
- 🎆 Particle system with GPU instancing
- 🎭 Texture support with automatic mipmap generation
- 🎮 Camera system with perspective and orthographic projections

### Coming Soon
- 🌍 Dynamic shadow mapping
- 🎵 3D audio system
- 🎮 Physics engine integration
- 🎨 Advanced material editor
- 📦 GLTF model loading
- 🎬 Animation system
- 🌐 Scene graph management
- 🎯 Picking and raycasting

## 🚀 Quick Start

```bash
# Clone the repository
git clone https://github.com/manugeni/vivid-engine.git

# Navigate to the project directory
cd vivid-engine

# Install dependencies
npm install

# Start the development server
npm run dev
```

Visit `http://localhost:5173` to see the demo in action!

## 🎮 Demos

- 🎆 [Particle System Demo](/demo/particle-demo.html) - Showcases the particle system with fountain, fire, and smoke effects
- More demos coming soon!

## 🛠️ Usage

```javascript
import { Engine, Scene, Camera } from '@manugeni/vivid-engine';

// Create a new engine instance
const engine = new Engine(canvas);

// Set up your scene
const scene = new Scene();
const camera = new Camera();

// Add objects, lights, and effects
// ... your scene setup code ...

// Start the render loop
engine.start();
```

## 📚 Documentation

Comprehensive documentation is coming soon! Stay tuned for detailed guides and API references.

## 🤝 Contributing

We welcome contributions! Here's how you can help:

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

Please read our [Contributing Guidelines](CONTRIBUTING.md) for details.

## 👥 Team

- **Lead Developer**: [@manugeni](https://github.com/manugeni) | [@callmerendani](https://twitter.com/callmerendani)

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🌟 Show Your Support

If you find Vivid Engine helpful, please consider:

- Giving it a ⭐️ on GitHub
- Following me on Twitter [@callmerendani](https://twitter.com/callmerendani)
- Sharing it with others

## 🙏 Acknowledgments

Special thanks to:
- The WebGL and graphics programming community
- All our contributors and supporters
- Everyone who has starred and forked the project
