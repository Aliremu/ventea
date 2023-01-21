
import * as VENTEA from 'ventea';

const canvas = document.createElement('canvas');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

document.body.appendChild(canvas);

canvas.onclick = () => {
    canvas.requestPointerLock();
};

(async () => {
    // Initializes the engine with WebGL and physics disabled
    const engine = new VENTEA.Engine(canvas);
    await engine.init({
        api: VENTEA.API.WebGL,
        physics: false
    });

    // Creates perspective camera and first person controls
    const camera = new VENTEA.PerspectiveCamera(90, canvas.width / canvas.height, 0.01, 1000.0);

    const controls = new VENTEA.FirstPersonControls(camera);
    controls.update();

    const scene = new VENTEA.Scene();

    // Creates a directional light and sets the color and direction
    const light = scene.createEntity('Light');
    light.addComponent(VENTEA.Light, { r: 2, g: 1.8, b: 1.4, type: VENTEA.LightType.Directional });
    light.position.set(1, 1, 1);

    const grid = scene.createEntity('Grid');
    grid.addComponent(VENTEA.MeshRenderer, new VENTEA.GridMesh(100, 100));

    const box = scene.createEntity('Box');
    box.addComponent(VENTEA.MeshRenderer, new VENTEA.BoxMesh(2, 2, 2));
    box.position.set(0, 1, 0);
    
    // Resizes the canvas on window resize
    window.addEventListener('resize', (e) => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;

      camera.aspect = canvas.width / canvas.height;
      camera.updateProjection();

      VENTEA.Renderer.resize(window.innerWidth, window.innerHeight);
    });

    const render = (time: number) => {
        controls.update();

        // Rotates the box by 0.01 radians every frame on the y-axis
        box.rotation.y += 0.01;

        // Renders the scene
        VENTEA.Renderer.renderScene(scene, time, camera);

        requestAnimationFrame(render);
    }

    requestAnimationFrame(render);
})();