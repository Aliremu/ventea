import * as VENTEA from 'ventea';

const canvas = document.createElement('canvas');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

document.body.appendChild(canvas);

canvas.onclick = () => {
    canvas.requestPointerLock();
};

(async () => {
    const engine = new VENTEA.Engine(canvas);
    await engine.init({
        api: VENTEA.API.WebGL,
        physics: false 
    });

    const camera = new VENTEA.PerspectiveCamera(90, canvas.width / canvas.height, 0.01, 1000.0);
    // const skyboxTexture = await VENTEA.Resources.loadTexture('FS003_Day_Sunless.png', {
    //     mip: false
    // });

    const skyboxTexture = new VENTEA.Texture2D(1, 1);
    skyboxTexture.setData(new Uint8Array([255, 255, 255, 255]));

    const controls = new VENTEA.FirstPersonControls(camera);
    controls.update();

    const scene = new VENTEA.Scene();
    scene.background = skyboxTexture;

    const light = scene.createEntity('Light');
    light.addComponent(VENTEA.Light, { r: 1, g: 1, b: 1, type: VENTEA.LightType.Directional });
    light.position.set(1, 1, 0);

    const light2 = scene.createEntity('Light');
    light2.addComponent(VENTEA.Light, { r: 1, g: 1, b: 1, type: VENTEA.LightType.Directional });
    light2.position.set(-1, 1, 0);

    const light3 = scene.createEntity('Light');
    light3.addComponent(VENTEA.Light, { r: 1, g: 1, b: 1, type: VENTEA.LightType.Directional });
    light3.position.set(1, -1, 0);

    const light4 = scene.createEntity('Light');
    light4.addComponent(VENTEA.Light, { r: 1, g: 1, b: 1, type: VENTEA.LightType.Directional });
    light4.position.set(-1, -1, 0);

    const sphereData = new VENTEA.SphereMesh(0.5);

    for(let y = 0; y < 7; y++) {
        for(let x = 0; x < 7; x++) {
            const mesh = new VENTEA.Mesh(sphereData, new VENTEA.PBRShaderMaterial({
                roughnessFactor: x / 6,
                metalnessFactor: y / 6,
                baseColor: new VENTEA.Vector3(1, 1, 1)
            }));
            const ball = scene.createEntity('Ball');
            ball.position.x = x * 2;
            ball.position.y = y * 2;

            ball.addComponent(VENTEA.MeshRenderer, mesh);
        }
    }
    
    window.addEventListener('resize', (e) => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;

      camera.aspect = canvas.width / canvas.height;
      camera.updateProjection();

      VENTEA.Renderer.resize(window.innerWidth, window.innerHeight);
    });

    const render = (time: number) => {        
        controls.update();

        VENTEA.Renderer.renderScene(scene, time, camera);

        requestAnimationFrame(render);
    }

    requestAnimationFrame(render);
})();
