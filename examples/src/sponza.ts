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
        physics: true 
    });

    const camera = new VENTEA.PerspectiveCamera(90, canvas.width / canvas.height, 0.01, 1000.0);
    const skyboxTexture = await VENTEA.Resources.load(VENTEA.Texture2D, 'FS003_Day_Sunless.png');

    const controls = new VENTEA.FirstPersonControls(camera);
    controls.update();

    const scene = new VENTEA.Scene();

    const skybox = scene.createEntity('Skybox');
    const skyboxMesh = new VENTEA.SphereMesh(500);
    skyboxMesh.subMeshes[0].material?.set('albedoTexture', skyboxTexture);
    skyboxMesh.subMeshes[0].material?.build();
    skybox.addComponent(VENTEA.MeshRenderer, skyboxMesh);
    skybox.position.set(0, 20, 0);
    skybox.rotation.set(0, 0, Math.PI);

    const player = scene.createEntity('Player');
    player.position.set(0, 10, 0);
    player
    .addComponent(VENTEA.CapsuleCollider, { radius: 0.35, halfHeight: 0.55 })
    .addComponent(VENTEA.RigidBody, { type: VENTEA.BodyType.Dynamic, restitution: 0 });
    VENTEA.Physics.lockRotation(player.handle);

    // const light = scene.createEntity('Light');
    // light.addComponent(VENTEA.Light, { r: 0.7, g: 0.2, b: 0.7, type: VENTEA.LightType.Point });
    // light.position.set(0, 2, 0);

    const light2 = scene.createEntity('Light');
    light2
    .addComponent(VENTEA.MeshRenderer, new VENTEA.SphereMesh(0.1))
    .addComponent(VENTEA.Light, { r: 1, g: 1, b: 1, type: VENTEA.LightType.Point });

    controls.target = player.position;
    
    const mapMesh = await VENTEA.Resources.load(VENTEA.GLTFMesh, 'Sponza.glb');
    const map = scene.createEntity('Map');
    map.addComponent(VENTEA.MeshRenderer, mapMesh)
    .addComponent(VENTEA.MeshCollider, mapMesh)
    .addComponent(VENTEA.RigidBody, { type: VENTEA.BodyType.Static })

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

        controls.target = new VENTEA.Vector3(xp, yp + 0.5, zp);
        
        controls.update();

        light2.position.set(3 * Math.cos(time / 1000), 1, 3 * Math.sin(time / 1000));

        const velocity = player.getComponent(VENTEA.Velocity);

        let newY = velocity!.y!;

        if(VENTEA.Input.isKeyDown('Space')) {
            newY = 4;
        }

        const x = camera.target.x - player.position.x;
        const z = camera.target.z - player.position.z;

        let velX = 0;
        let velZ = 0;

        if(VENTEA.Input.isKeyDown('KeyW')) {
            velX += x;
            velZ += z;
        }

        if(VENTEA.Input.isKeyDown('KeyA')) {
            velX += z;
            velZ += -x;
        }

        if(VENTEA.Input.isKeyDown('KeyS')) {
            velX += -x;
            velZ += -z;
        }

        if(VENTEA.Input.isKeyDown('KeyD')) {
            velX += -z;
            velZ += x;
        }

        const mag = Math.sqrt(velX * velX + velZ * velZ);

        if(mag > 0) {
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
