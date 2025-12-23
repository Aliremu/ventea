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

    const camera = new VENTEA.PerspectiveCamera(90, canvas.width / canvas.height, 0.01, 100.0);
    const size = 50;

    camera.position.set(size/2, 100, size/2);
    camera.lookAt(size/2, 0, size/2);
    const controls = new VENTEA.FirstPersonControls(camera);
    controls.update();
    // camera.updateView();

    const scene = new VENTEA.Scene();

    const dirLight = scene.createEntity('Light');
    dirLight.addComponent(VENTEA.Light, { r: 1, g: 1, b: 1, type: VENTEA.LightType.Directional });
    dirLight.position.set(1, 1, 1);

    const lol = 1;

    // const skybox = await VENTEA.Resources.load(VENTEA.Texture2D, 'FS003_Day_Sunless.png');

    // const boxMaterial = boxMesh.subMeshes[0].material!;
    // const texture = new VENTEA.Texture2D(4, 2);
    // texture.setData(new Uint8Array([
    //     255, 102, 159, 255, 255, 159, 102, 255, 236, 255, 102, 255, 121, 255, 102, 255, 102, 255,
    //     198, 255, 102, 198, 255, 255, 121, 102, 255, 255, 236, 102, 255, 255
    // ]));
    // boxMaterial.set('albedoTexture', skybox);
    // boxMaterial.build();

    const boxMesh = new VENTEA.BoxMesh(lol, lol, lol);

    for (let i = 0; i < size * size; i++) {
        const entity = scene.createEntity();
        entity.position.set(~~(i / size) * lol, 0, (i % size) * lol);

        entity.addComponent(VENTEA.MeshRenderer, new VENTEA.Mesh(boxMesh));
    }

    window.addEventListener('resize', (e) => {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        camera.aspect = canvas.width / canvas.height;
        camera.updateProjection();

        VENTEA.Renderer.resize(window.innerWidth, window.innerHeight);
    });

    let lastTime = 0;
    let times: number[] = [];

    const avg = (arr: number[]) => {
        return arr.reduce((l, r) => l + r) / arr.length;
    }

    const render = (time: number) => {
        if(lastTime == 0) {
            lastTime = time;
        } else {
            const diff = time - lastTime;
            times.push(diff);
            lastTime = time;
        }

        controls.update();

        scene.pool.forEach(e => {
            e.rotation.y += 0.02;
        });

        VENTEA.Renderer.renderScene(scene, time, camera);

        requestAnimationFrame(render);

        //32.850421578421575
        //30.44 FPS

        if(times.length > 100) {
            // console.log(avg(times));
        }
    }

    requestAnimationFrame(render);
})();
