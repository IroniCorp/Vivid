# Vault Engine (VE)
 *A lightweight, open-source 3D web engine for creating immersive experiences in the browser, powered by Three.js and WebXR.*

Vault Engine (VE) is a modern, modular 3D engine designed to bring real-time rendering and immersive experiences—such as games, virtual tours, and VR/AR applications—to the web. Built with simplicity and extensibility in mind, VE leverages [Three.js](https://threejs.org/) for rendering and [WebXR](https://immersiveweb.dev/) for VR/AR support, making it accessible across devices without heavy dependencies.

Developed by **manugeni**, Vault Engine is hosted on GitHub and live at [manugeni.github.io/VaultEngine/](https://manugeni.github.io/VaultEngine/). Whether you’re a developer building 3D apps or a creator exploring immersive storytelling, VE provides the tools to get started quickly.

## ✨ Features

- **Real-Time 3D Rendering**: High-performance graphics using Three.js, built on WebGL.
- **Camera Controls**: Intuitive navigation with mouse, touch, or keyboard inputs via OrbitControls.
- **Model Loading**: Import 3D assets with built-in GLTF support.
- **WebXR Integration**: Seamless VR and AR experiences on compatible devices.
- **Modular Design**: Extendable architecture for custom components and features.
- **No Framework Bloat**: Pure HTML, CSS, and JavaScript—no React or heavy libraries required.

## 🚀 Quick Start

### Try It Online
Visit [manugeni.is-a.dev/VaultEngine/](https://manugeni.is-a.dev/VaultEngine/) to explore the live demo, featuring templates like a basic 3D scene and VR experience.

### Local Development
1. **Clone the Repository**  
   ```bash
   git clone https://github.com/manugeni/VaultEngine.git
   cd VaultEngine
   ```

2. **Serve the Website**  
   Run a local server to view the project (required for module imports):
   ```bash
   npx http-server docs/
   ```
   Open `http://localhost:8080` in your browser.

3. **Explore Examples**  
   Check out the templates in `docs/examples/`:
   - `basic-cube/`: A simple rotating cube with lighting.
   - `vr-experience/`: A VR-ready scene using WebXR.

### Using Vault Engine in Your Project
1. Copy the `src/` folder to your project.
2. Include the engine in your HTML:
   ```html
   <script type="module">
     import { VaultEngine } from './src/core/VaultEngine.js';
     const engine = new VaultEngine(document.body);
     engine.start();
   </script>
   ```

## 📂 Project Structure

```
VaultEngine/
├── src/                   # Engine source code
│   ├── core/             # Core classes (VaultEngine.js, etc.)
│   ├── components/       # Reusable components
│   └── utils/            # Utilities (loaders, inputs)
├── docs/                 # Website files for GitHub Pages
│   ├── index.html        # Landing page with features and templates
│   ├── js/              # Copy of src/ for web serving
│   ├── assets/          # 3D models, textures, etc.
│   └── examples/        # Demo templates
├── README.md             # This file
└── LICENSE               # MIT License
```

## 🛠️ Development

- **Dependencies**: Only Three.js (loaded via CDN).
- **Build**: Manually copy `src/` to `docs/js/` before pushing to GitHub, or use a script:
  ```bash
  cp -r src/* docs/js/
  ```

## 🤝 Contributing

Contributions are welcome! Fork the repo, make your changes, and submit a pull request. See issues for feature ideas or bugs.

## 📜 License

Vault Engine is licensed under the [MIT License](LICENSE).

## 🌟 Acknowledgements

- [Three.js](https://threejs.org/) for an amazing 3D library.
- [WebXR](https://immersiveweb.dev/) for immersive web standards.
- Built with ❤️ by **manugeni**.

---
Follow **manugeni** on GitHub for updates!
```
