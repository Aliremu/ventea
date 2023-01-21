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
        api: VENTEA.API.WebGPU,
        physics: false
    });

    const camera = new VENTEA.PerspectiveCamera(90, canvas.width / canvas.height, 0.01, 500.0);

    const controls = new VENTEA.FirstPersonControls(camera);
    controls.update();

    const scene = new VENTEA.Scene();

    const lol = 1;

    const skybox = await VENTEA.Resources.load(VENTEA.Texture2D, 'FS003_Day_Sunless.png');

    const boxMesh = new VENTEA.BoxMesh(lol, lol, lol);
    const boxMaterial = boxMesh.subMeshes[0].material!;
    // const texture = new VENTEA.Texture2D(4, 2);
    // texture.setData(new Uint8Array([
    //     255, 102, 159, 255, 255, 159, 102, 255, 236, 255, 102, 255, 121, 255, 102, 255, 102, 255,
    //     198, 255, 102, 198, 255, 255, 121, 102, 255, 255, 236, 102, 255, 255
    // ]));
    boxMaterial.set('albedoTexture', skybox);
    boxMaterial.build();

    const size = 150;

    for (let i = 0; i < size * size; i++) {
        const entity = scene.createEntity();
        entity.position.set(~~(i / size) * lol, 0, (i % size) * lol);

        entity.addComponent(VENTEA.MeshRenderer, boxMesh);
    }


    const floorMesh = new VENTEA.BoxMesh(10, 5, 10);
    // const floorMat = floorMesh.subMeshes[0].material!;
    // floorMat.set('albedoTexture', texture);
    // floorMat.build();

    const floor = scene.createEntity('Floor').addComponent(VENTEA.MeshRenderer, floorMesh).position.set(0, -2.5, 0);

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
            e.rotation.y += 0.05;
        });

        VENTEA.Renderer.renderScene(scene, time, camera);

        requestAnimationFrame(render);
    }

    requestAnimationFrame(render);
})();
