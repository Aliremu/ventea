import * as VENTEA from 'venteajs';

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

    const camera = new VENTEA.PerspectiveCamera(90, canvas.width / canvas.height, 0.01, 1000.0);
    // const camera = new VENTEA.OrthographicCamera(-canvas.width/2, canvas.width/2, -canvas.height/2, canvas.height/2, -100, 100);
    // camera.eye.set(canvas.width / 2, canvas.height / 2, 2);
    // camera.target.set(canvas.width / 2, canvas.height / 2, 0);
    // camera.zoom = 1;
    // camera.updateProjection();
    // camera.updateView();

    const controls = new VENTEA.FirstPersonControls(camera);
    // const controls = new VENTEA.OrbitControls(camera);
    controls.update();

    const src = await (await fetch('compute.wgsl')).text();

    const nbBalls = 1_000;

    const computeShader = new VENTEA.ComputeShader(src);
    const outputBuffer = new VENTEA.ComputeBuffer(nbBalls, 24);
    const inputBuffer = new VENTEA.ComputeBuffer(nbBalls, 24);
    const sceneBuffer = new VENTEA.ComputeBuffer(1, 8);

    const test = true;

    const width = test ? 100 : canvas.width;
    const height = test ? 100 : canvas.height;

    sceneBuffer.setData(0,
        new Float32Array([width, height])
    );

    let inputBalls = new Float32Array(nbBalls * 6);

    const scene = new VENTEA.Scene();

    const mesh = new VENTEA.SphereMesh(1);

    const random = (min: number, max: number) => Math.random() * (max - min) + min;

    const balls: VENTEA.Entity[] = [];

    for (let i = 0; i < nbBalls; i++) {
        const ball = scene.createEntity();
        ball.addComponent(VENTEA.MeshRenderer, mesh);

        const radius = random(0.2, 1);
        const x = random(0, width);
        const y = random(0, height);

        inputBalls[i * 6 + 0] = radius; // radius
        inputBalls[i * 6 + 1] = i; // padding
        inputBalls[i * 6 + 2] = x; // position.x
        inputBalls[i * 6 + 3] = y; // position.y
        inputBalls[i * 6 + 4] = random(-10, 10); // velocity.x
        inputBalls[i * 6 + 5] = random(-10, 10); // velocity.y

        ball.scale.set(radius, radius, radius);
        ball.position.set(x, 0, y);

        balls.push(ball);
    }

    inputBuffer.setData(0, inputBalls);

    computeShader.setBuffer("input", inputBuffer);
    computeShader.setBuffer("output", outputBuffer);
    computeShader.setBuffer("scene", sceneBuffer);

    // const floorMesh = new VENTEA.BoxMesh(width, 0, height);
    // const data = floorMesh.positionBuffer.data;
    // for(let i = 0; i < data.length / 3; i++) {
    //     data[i * 3 + 1] = -10;
    // }
    // floorMesh.positionBuffer.setData(data);
    const grid = scene.createEntity('Floor').addComponent(VENTEA.MeshRenderer, new VENTEA.GridMesh(width, height)).position.set(width/2, 0, height/2);
    // const floor = scene.createEntity('Floor').addComponent(VENTEA.MeshRenderer, floorMesh).position.set(width/2, 0, height/2);
    // const grid = scene.createEntity('Grid').addComponent(VENTEA.MeshRenderer, await VENTEA.Resources.load(VENTEA.GLTFMesh, 'Finale Version 16.glb')).position.set(width/2, height/2, 0);

    window.addEventListener('resize', (e) => {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        camera.aspect = canvas.width / canvas.height;
        camera.updateProjection();

        VENTEA.Renderer.resize(window.innerWidth, window.innerHeight);
    });

    const render = async (time: number) => {
        controls.update();

        computeShader.dispatch(Math.ceil(nbBalls / 100));
        await outputBuffer.getData().then(data => {
            inputBuffer.setData(0, data);

            const view = new Float32Array(data);
    
            for (let i = 0; i < nbBalls; i++) {
                const x = view[i * 6 + 2];
                const y = view[i * 6 + 3];
    
                balls[view[i * 6 + 1]].position.set(x, 0, y);
            }
        });
        
        VENTEA.Renderer.renderScene(scene, time, camera);
        requestAnimationFrame(render);
    }

    requestAnimationFrame(render);
})();