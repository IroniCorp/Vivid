# 🌟 Vivid Engine

A powerful, modern WebGL 2.0 3D engine designed for high-performance graphics and visual effects in web browsers.

![Vivid Engine](/assets/banner.png)
![Screenshot](/assets/screenshot.png) <!-- Replace with actual screenshot/demo image -->

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
git clone https://github.com/manugeni/Vivid.git

# Navigate to the project directory
cd Vivid

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
import { Engine, Scene, Camera } from 'vivid';

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

Contributions are welcome! Please feel free to submit a Pull Request.

## 👥 Team

- **Lead Developer**: [@manugeni](https://github.com/manugeni) | [@callmerendani](https://twitter.com/callmerendani)
- **Organization**: [Ironi Corporation](https://github.com/ironi-corp) | [@ironi_corp](https://twitter.com/ironi_corp)

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🌟 Show Your Support

Give a ⭐️ if this project helped you!
