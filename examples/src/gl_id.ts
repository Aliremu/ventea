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

    const camera = new VENTEA.PerspectiveCamera(90, canvas.width / canvas.height, 0.01, 500.0);
    camera.eye.set(5, 10, 5);
    camera.lookAt(5, 0, 5);
    const controls = new VENTEA.FirstPersonControls(camera);
    controls.update();
    // camera.updateView();

    const scene = new VENTEA.Scene();

    const dirLight = scene.createEntity('Light');
    dirLight.addComponent(VENTEA.Light, { r: 1, g: 1, b: 1, type: VENTEA.LightType.Directional });
    dirLight.position.set(1, 1, 1);

    const lol = 1;

    // const skybox = await VENTEA.Resources.load(VENTEA.Texture2D, 'FS003_Day_Sunless.png');

    const boxMesh = new VENTEA.BoxMesh(lol, lol, lol);
    // const boxMaterial = boxMesh.subMeshes[0].material!;
    // const texture = new VENTEA.Texture2D(4, 2);
    // texture.setData(new Uint8Array([
    //     255, 102, 159, 255, 255, 159, 102, 255, 236, 255, 102, 255, 121, 255, 102, 255, 102, 255,
    //     198, 255, 102, 198, 255, 255, 121, 102, 255, 255, 236, 102, 255, 255
    // ]));
    // boxMaterial.set('albedoTexture', skybox);
    // boxMaterial.build();

    {
        const entity = scene.createEntity();
        entity.position.set(0, 0, 10);
        entity.addComponent(VENTEA.MeshRenderer, boxMesh);
    }

    const size = 5;

    for (let i = 0; i < size * size; i++) {
        const entity = scene.createEntity();
        entity.position.set(i, 0, 0);

        entity.addComponent(VENTEA.MeshRenderer, boxMesh);
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

        scene.pool.forEach(e => {
            // e.rotation.y += 0.02;
        });

        VENTEA.Renderer.renderScene(scene, time, camera);

        requestAnimationFrame(render);
    }

    requestAnimationFrame(render);
})();
