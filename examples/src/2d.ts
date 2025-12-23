
import * as VENTEA from 'ventea';

const canvas = document.createElement('canvas');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

document.body.appendChild(canvas);

canvas.onclick = () => {
    canvas.requestPointerLock();
};

const connect = (): Promise<WebSocket> => {
    return new Promise(function (resolve, reject) {
        const server = new WebSocket('ws://127.0.0.1:8080');
        server.onopen = function () {
            resolve(server);
        };
        server.onerror = function (err) {
            reject(err);
        };
    });
}

(async () => {
    // Initializes the engine with WebGL and physics disabled
    const engine = new VENTEA.Engine(canvas);
    await engine.init();

    const socket = await connect();

    // Creates perspective camera and first person controls
    const aspect = canvas.width / canvas.height;
    const w = 6 * aspect;
    const h = 6;
    const camera = new VENTEA.OrthographicCamera(-w / 2 + 1, w / 2 + 1, -h / 2 + 1, h / 2 + 1, 0.01, 1000.0);
    const scene = new VENTEA.Scene();

    // Creates a directional light and sets the color and direction
    const light = scene.createEntity('Light');
    light.addComponent(VENTEA.Light, { r: 2, g: 1.8, b: 1.4, type: VENTEA.LightType.Directional });
    light.position.set(1, 1, 1);

    const grid = scene.createEntity('Grid');
    grid.addComponent(VENTEA.MeshRenderer, new VENTEA.GridMesh(1000, 1000));
    grid.position.set(0, 0, -1);
    grid.rotation.set(Math.PI / 2, 0, 0);

    const agent = scene.createEntity('Box');
    agent.addComponent(VENTEA.MeshRenderer, new VENTEA.BoxMesh(1, 1, 1));
    agent.position.set(2, 0, -100);

    {
        const back = scene.createEntity('Box');
        const black = new VENTEA.Texture2D(1, 1);
        black.setData(new Uint8Array([0, 0, 0, 255]));
        const blackBox = new VENTEA.BoxMesh(1, 1, 1);
        blackBox.subMeshes[0].material?.set('albedoTexture', black);
        blackBox.subMeshes[0].material?.build();
        back.addComponent(VENTEA.MeshRenderer, blackBox);
        back.position.set(1, 1, -100);
    }

    {
        const target = scene.createEntity('Box');
        const green = new VENTEA.Texture2D(1, 1);
        green.setData(new Uint8Array([0, 255, 0, 255]));
        const greenBox = new VENTEA.BoxMesh(1, 1, 1);
        greenBox.subMeshes[0].material?.set('albedoTexture', green);
        greenBox.subMeshes[0].material?.build();
        target.addComponent(VENTEA.MeshRenderer, greenBox);
        target.position.set(3, 2, -100);
    }

    {
        const bad = scene.createEntity('Box');
        const red = new VENTEA.Texture2D(1, 1);
        red.setData(new Uint8Array([255, 0, 0, 255]));
        const redBox = new VENTEA.BoxMesh(1, 1, 1);
        redBox.subMeshes[0].material?.set('albedoTexture', red);
        redBox.subMeshes[0].material?.build();
        bad.addComponent(VENTEA.MeshRenderer, redBox);
        bad.position.set(3, 1, -100);
    }

    {
        const back = scene.createEntity('Box');
        const black = new VENTEA.Texture2D(1, 1);
        black.setData(new Uint8Array([0, 0, 0, 255]));
        const blackBox = new VENTEA.BoxMesh(5, 4, 1);
        blackBox.subMeshes[0].material?.set('albedoTexture', black);
        blackBox.subMeshes[0].material?.build();
        back.addComponent(VENTEA.MeshRenderer, blackBox);
        back.position.set(1.5, 1, -120);
    }

    {
        const back = scene.createEntity('Box');
        const black = new VENTEA.Texture2D(1, 1);
        black.setData(new Uint8Array([210, 210, 210, 255]));
        const blackBox = new VENTEA.BoxMesh(4, 3, 1);
        blackBox.subMeshes[0].material?.set('albedoTexture', black);
        blackBox.subMeshes[0].material?.build();
        back.addComponent(VENTEA.MeshRenderer, blackBox);
        back.position.set(1.5, 1, -110);
    }

    // Resizes the canvas on window resize
    window.addEventListener('resize', (e) => {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        const aspect = canvas.width / canvas.height;

        camera.left = -6 / 2 * aspect + 1;
        camera.right = 6 / 2 * aspect + 1;
        camera.updateProjection();

        VENTEA.Renderer.resize(window.innerWidth, window.innerHeight);
    });

    const rand = (min: number, max: number) => ~~(Math.random() * (max - min) + min);

    socket.addEventListener('message', async (event) => {
        if(event.data == "NEXT") {
            const { x, y } = agent.position;
            socket.send(new Float32Array([
                0,
                x,
                y
            ]));
            return;
        }
        let action = 0;
        const { x: a, y: b } = agent.position;

        switch (event.data) {
            case 'N': agent.position.y++; action = 0; break;
            case 'E': agent.position.x++; action = 1; break;
            case 'S': agent.position.y--; action = 2; break;
            case 'W': agent.position.x--; action = 3; break;
            case 'R': {
                // const x = rand(-5, 5);
                // const y = rand(-5, 5);
                agent.position.set(0, 0, -100);
                break;
            }
        }

        agent.position.x = VENTEA.Utils.clamp(agent.position.x, 0, 3);
        agent.position.y = VENTEA.Utils.clamp(agent.position.y, 0, 2);

        if(agent.position.x == 1 && agent.position.y == 1) {
            agent.position.set(a, b, -100);
        }

        const { x, y } = agent.position;
        socket.send(new Float32Array([
            1,
            x,
            y,
            action
        ]));

        console.log(x, y);
    });

    const { x, y } = agent.position;
    socket.send(new Float32Array([
        0,
        x,
        y
    ]));

    const render = (time: number) => {
        VENTEA.Renderer.renderScene(scene, time, camera);

        requestAnimationFrame(render);
    }

    requestAnimationFrame(render);
})();