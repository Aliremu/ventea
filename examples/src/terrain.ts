import * as VENTEA from 'ventea';

import noise from './perlin';

const canvas = document.createElement('canvas');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

document.body.appendChild(canvas);

canvas.onclick = () => {
    canvas.requestPointerLock();
};

const generateTerrain = (width: number, depth: number): VENTEA.MeshData => {
    noise.seed(Math.random());

    const positions = new Float32Array(width * depth * 3);
    const texCoords = new Float32Array(width * depth * 2);

    const indices = new Uint32Array((width - 1) * (depth - 1) * 6);

    let i = 0;
    let t = 0;

    for (let z = 0; z < depth; z++) {
        for (let x = 0; x < width; x++) {
            positions[i++] = x - width / 2;
            positions[i++] = noise.octaveSimple2(x / width, z / depth, 5) * 50;
            positions[i++] = z - depth / 2;

            texCoords[t++] = x / width * 64;
            texCoords[t++] = z / depth * 64;
        }
    }

    i = 0;

    for (let z = 0; z < depth - 1; z++) {
        for (let x = 0; x < width - 1; x++) {

            let row1 = z * (width);
            let row2 = (z + 1) * (width);

            indices[i++] = row1 + x;
            indices[i++] = row2 + x;
            indices[i++] = row2 + x + 1;

            indices[i++] = row1 + x;
            indices[i++] = row2 + x + 1;
            indices[i++] = row1 + x + 1;
        }
    }

    const meshData = new VENTEA.MeshData(positions, undefined, texCoords, indices);
    meshData.recalculateNormals();

    console.log(meshData);

    return meshData;
}

(async () => {
    const engine = new VENTEA.Engine(canvas);
    await engine.init({
        api: VENTEA.API.WebGL,
        physics: true
    });

    const camera = new VENTEA.PerspectiveCamera(90, canvas.width / canvas.height, 0.01, 1000.0);
    const skyboxTexture = await VENTEA.Resources.loadTexture('FS003_Night_Moonless.png', {
        mip: false
    });

    const controls = new VENTEA.FirstPersonControls(camera);
    controls.update();

    const scene = new VENTEA.Scene();
    scene.background = skyboxTexture;

    const player = scene.createEntity('Player');
    player.position.set(0, 10, 0);
    player
        .addComponent(VENTEA.CapsuleCollider, { radius: 0.35, halfHeight: 0.55 })
        .addComponent(VENTEA.RigidBody, { type: VENTEA.BodyType.Dynamic, restitution: 0 });
    VENTEA.Physics.lockRotation(player.handle);

    const light = scene.createEntity('Light');
    // light.addComponent(VENTEA.Light, { r: 0.15, g: 0.10, b: 0.3, type: VENTEA.LightType.Directional });
    light.addComponent(VENTEA.Light, { r: 1, g: 1, b: 1, type: VENTEA.LightType.Directional });
    light.position.set(0, 1, 0);

    const skyMaterial = new VENTEA.PBRShaderMaterial({
        albedoTexture: skyboxTexture
    });

    const light2 = scene.createEntity('Light');
    const aaa = new VENTEA.Mesh(new VENTEA.SphereMesh(0.1), skyMaterial);
    light2
        .addComponent(VENTEA.MeshRenderer, aaa)
        .addComponent(VENTEA.Light, { r: 0, g: 0, b: 0, type: VENTEA.LightType.Point });

    controls.target = player.position;

    // mapMesh.material = videoMaterial;

    const terrainData = generateTerrain(500, 500);
    const texture = new VENTEA.Texture2D(2, 2, VENTEA.TextureFormat.BGRA8UNORM, {
        magFilter: VENTEA.SamplerFilter.Nearest
    });
    
    // texture.setData(new Uint8Array([
    //     255, 102, 159, 255, 255, 159, 102, 255, 236, 255, 102, 255, 121, 255, 102, 255, 102, 255,
    //     198, 255, 102, 198, 255, 255, 121, 102, 255, 255, 236, 102, 255, 255
    // ]));

    texture.setData(new Uint8Array([0, 0, 0, 255, 255, 255, 255, 255, 255, 255, 255, 255, 0, 0, 0, 255
    ]));

    const terrainMaterial = new VENTEA.PBRShaderMaterial({
        albedoTexture: texture,
        metalnessFactor: 0,
        roughnessFactor: 1
    });

    const terrain = new VENTEA.Mesh(terrainData, terrainMaterial);

    const map = scene.createEntity('Map');
    // map.scale.set(10, 10, 10);
    map.addComponent(VENTEA.MeshRenderer, terrain)
        .addComponent(VENTEA.MeshCollider, terrain)
        .addComponent(VENTEA.RigidBody, { type: VENTEA.BodyType.Static });

    const height = 5;
    const cube = new VENTEA.Mesh(new VENTEA.BoxMesh(), terrainMaterial);

    for (let y = 0; y < height; y++) {
        let size = (2 * height - 1) - (2 * y);
        for (let x = 0; x < size; x++) for (let z = 0; z < size; z++) {
            const entity = scene.createEntity();
            entity.position.x = 1 * (x - size / 2);
            entity.position.y = 1 * y + 50;
            entity.position.z = 1 * (z - size / 2);

            entity.addComponent(VENTEA.MeshRenderer, cube);
            entity.addComponent(VENTEA.BoxCollider, { x: 1, y: 1, z: 1 });
            entity.addComponent(VENTEA.RigidBody, { type: VENTEA.BodyType.Dynamic });
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
        //TODO: ugly
        const alpha = VENTEA.Utils.clamp(50 * ((time - VENTEA.Physics.lastTime) / 1000), 0, 1);

        const xp = VENTEA.Utils.lerp(VENTEA.LastPosition.x[player.handle], player.position.x, alpha);
        const yp = VENTEA.Utils.lerp(VENTEA.LastPosition.y[player.handle], player.position.y, alpha);
        const zp = VENTEA.Utils.lerp(VENTEA.LastPosition.z[player.handle], player.position.z, alpha);

        controls.target = new VENTEA.Vector3(xp, yp + 0.4, zp);

        controls.update();

        light.position.set(3 * Math.cos(time / 1000), 1, 3 * Math.sin(time / 1000));

        const velocity = player.getComponent(VENTEA.Velocity);

        let newY = velocity!.y!;

        if (VENTEA.Input.isKeyDown('Space')) {
            newY = 4;
        }

        const x = Math.sin(camera.yaw);
        const z = -Math.cos(camera.yaw);

        let velX = 0;
        let velZ = 0;

        if (VENTEA.Input.isKeyDown('KeyW')) {
            velX += x;
            velZ += z;
        }

        if (VENTEA.Input.isKeyDown('KeyA')) {
            velX += z;
            velZ += -x;
        }

        if (VENTEA.Input.isKeyDown('KeyS')) {
            velX += -x;
            velZ += -z;
        }

        if (VENTEA.Input.isKeyDown('KeyD')) {
            velX += -z;
            velZ += x;
        }

        const mag = Math.sqrt(velX * velX + velZ * velZ);

        if (mag > 0) {
            velX /= mag;
            velZ /= mag;
        }

        const newX = velocity!.x / 2 + 2 * velX;
        const newZ = velocity!.z / 2 + 2 * velZ;
        VENTEA.Physics.setLinearVelocity(player.handle, new VENTEA.Vector3(newX, newY, newZ));

        VENTEA.Renderer.renderScene(scene, time, camera);

        requestAnimationFrame(render);
    }

    requestAnimationFrame(render);
})();
