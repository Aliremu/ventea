# Ventea🍃🍵
Javascript modules based game engine with WebGL. [Demo](https://xirei.moe/mc/)

![Example](https://xirei.moe/uploader/?f=s0jauiww.jpg)
![Grass](https://xirei.moe/uploader/?f=4g6nooea.jpg)
![Piano](https://xirei.moe/uploader/?f=u26g4ppf.jpg)

## Features
- [x] GLB / GLTF Mesh loading and rendering
- [x] ImGUI debug layer
- [x] Resource loading and management
- [x] Built in Cube, Sphere and Capsule meshes
- [x] Procedural Terrain generation
- [x] Multi-threaded physics using NVidia PhysX WASM port by ashconnell
- [x] Entity Component System using bitECS
- [x] MeshRenderer, MeshCollider, BoxCollider, SphereCollider, RigidBody, DirectionalLight components
- [x] Shader and Framebuffer support
- [x] 2D Textures and Cubemap support 
- [x] Cascaded Shadow Maps
- [x] Bloom Post Processing Effect
- [x] Blur Post Processing Effect 
- [x] Instanced Rendering Support
- [x] Skybox

## TODO
- [ ] Support for Physically Based Rendering
- [ ] Animation support
- [ ] Volumetric Clouds
- [ ] AI Pathfinding
- [ ] Improve memory management

## Usage/Examples

```javascript
import * as VENTEA from 'Ventea.js'

const canvas = document.getElementById('surface');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

canvas.onclick = () => {
    canvas.requestPointerLock();
}

const engine = new VENTEA.Engine(canvas, window.innerWidth, window.innerHeight);
await engine.init();

const cube = new VENTEA.Cube(1, 1, 1);
const floor = new VENTEA.Cube(100, 1, 100);

const camera = new VENTEA.Camera(glMatrix.toRadian(90), window.innerWidth / window.innerHeight, 0.1, 500);
const control = new VENTEA.Controller(camera, engine);
const scene = new VENTEA.Scene();
scene.camera = camera;

const ground = scene.createEntity();
ground.addComponent(VENTEA.Components.MeshRenderer, floor);
ground.addComponent(VENTEA.Components.BoxCollider, { x: 100, y: 1, z: 100 });
ground.addComponent(VENTEA.Components.RigidBody, { type: 'static' });

const height = 5;

for (let y = 0; y < height; y++) {
    let size = (2 * height - 1) - (2 * y);
    for (let x = 0; x < size; x++) for (let z = 0; z < size; z++) {
        const entity = scene.createEntity();
        entity.position.x = 1 * (x - size / 2);
        entity.position.y = 1 * y + 1;
        entity.position.z = 1 * (z - size / 2);

        entity.addComponent(VENTEA.Components.MeshRenderer, cube);
        entity.addComponent(VENTEA.Components.BoxCollider, { x: 1, y: 1, z: 1 });
        entity.addComponent(VENTEA.Components.RigidBody, { type: 'dynamic' });
    }
}

const shader = await VENTEA.Shader.create('./assets/shader/shader.vert', './assets/shader/shader.frag');

const loop = (time) => {
    control.update();

    // VENTEA.Renderer.startDebug(scene, time, canvas);

    engine.surface.resize(window.innerWidth, window.innerHeight);

    VENTEA.Renderer.renderScene(shader, scene, time);

    // VENTEA.Renderer.endDebug();

    VENTEA.Renderer.stateReset();

    requestAnimationFrame(loop);
}

requestAnimationFrame(loop);
```

