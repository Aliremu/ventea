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
    const terrainMesh = await VENTEA.Resources.load(VENTEA.GLTFMesh, 'Mesher.glb');

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

    scene.createEntity('Grid').addComponent(VENTEA.MeshRenderer, new VENTEA.GridMesh(1000, 1000));

    const player = scene.createEntity('Player');
    player.position.set(0, 10, 0);
    player.addComponent(VENTEA.SphereCollider, { radius: 0.5 }).addComponent(VENTEA.RigidBody, { type: VENTEA.BodyType.Dynamic });

    controls.target = player.position;

    const diameter = 0.5;

    const sphere = new VENTEA.SphereMesh(diameter/2);
    const sphereMaterial = sphere.subMeshes[0].material!;
    const texture = new VENTEA.Texture2D(4, 2);
    texture.setData(new Uint8Array([
        255, 102, 159, 255, 255, 159, 102, 255, 236, 255, 102, 255, 121, 255, 102, 255, 102, 255,
        198, 255, 102, 198, 255, 255, 121, 102, 255, 255, 236, 102, 255, 255
    ]));
    sphereMaterial.set('albedoTexture', texture);
    sphereMaterial.build();

    const size = 5;
    for(let y = 0; y < 3; y++) {
        for (let i = 0; i < size * size; i++) {
            const entity = scene.createEntity();
            entity.position.set(~~(i / size) * diameter, 20 + y * diameter, (i % size) * diameter);
            
            entity
            .addComponent(VENTEA.MeshRenderer, sphere)
            .addComponent(VENTEA.SphereCollider, { radius: diameter/2 })
            .addComponent(VENTEA.RigidBody, { type: VENTEA.BodyType.Dynamic });
        }
    }

    const terrain = scene.createEntity('Terrain');
    terrain.position.set(0, -50, 0);
    terrain.scale.set(10, 10, 10);
    terrain
        .addComponent(VENTEA.MeshRenderer, terrainMesh)
        .addComponent(VENTEA.MeshCollider, terrainMesh)
        .addComponent(VENTEA.RigidBody, { type: VENTEA.BodyType.Static });

    window.addEventListener('resize', (e) => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;

      camera.aspect = canvas.width / canvas.height;
      camera.updateProjection();

      VENTEA.Renderer.resize(window.innerWidth, window.innerHeight);
    });

    let onGround = false;
    let selectedEntity: VENTEA.Entity | null = null;

    document.addEventListener('click', (e) => {
        if(selectedEntity) {
            const x = 100 * controls.lookDir.x;
            const y = 100 * controls.lookDir.y;
            const z = 100 * controls.lookDir.z;
            VENTEA.Physics.setLinearVelocity(selectedEntity.handle, new VENTEA.Vector3(x, y, z));
            selectedEntity = null;
            return;
        }

        VENTEA.Physics.raycast(player.position, controls.lookDir, 100, (eid: number[]) => {
            for(const e of eid) {
                if(e == player.handle || e == terrain.handle) continue;

                selectedEntity = scene.pool[e];
                return;
            }
        });
    });

    const render = (time: number) => {
        const alpha = VENTEA.Utils.clamp(50 * ((time - VENTEA.Physics.lastTime) / 1000), 0, 1);

        const xp = VENTEA.Utils.lerp(VENTEA.LastPosition.x[player.handle], player.position.x, alpha);
        const yp = VENTEA.Utils.lerp(VENTEA.LastPosition.y[player.handle], player.position.y, alpha);
        const zp = VENTEA.Utils.lerp(VENTEA.LastPosition.z[player.handle], player.position.z, alpha);

        controls.target = new VENTEA.Vector3(xp, yp, zp);
        
        controls.update();

        // VENTEA.Physics.raycast(player.position, new VENTEA.Vector3(0, -1, 0), 0.7, (eids: number[]) => {
        //     onGround = false;

        //     for(const e of eids) {
        //         if(e != player.handle) {
        //             onGround = true;
        //         }
        //     }
        // });

        const velocity = player.getComponent(VENTEA.Velocity);

        let newY = velocity!.y!;

        if(VENTEA.Input.isKeyDown('Space') && onGround) {
            newY = 4;
        }

        const x = Math.cos(controls.yaw * VENTEA.Utils.DEG_TO_RAD);
        const z = Math.sin(controls.yaw * VENTEA.Utils.DEG_TO_RAD);

        const vel = new VENTEA.Vector2();

        if(VENTEA.Input.isKeyDown('KeyW')) {
            vel.add(x, z);
        }

        if(VENTEA.Input.isKeyDown('KeyA')) {
            vel.add(z, -x);
        }

        if(VENTEA.Input.isKeyDown('KeyS')) {
            vel.add(-x, -z);
        }

        if(VENTEA.Input.isKeyDown('KeyD')) {
            vel.add(-z, x);
        }

        vel.normalize();

        if(VENTEA.Input.isKeyDown('ShiftLeft')) {
            vel.mul(2);
        }

        const newX = velocity!.x / 2 + vel.x;
        const newZ = velocity!.z / 2 + vel.y;

        if(!(newX == 0 && newY == 0 && newZ == 0))
            VENTEA.Physics.setLinearVelocity(player.handle, new VENTEA.Vector3(newX, newY, newZ));

        if(selectedEntity != null) {
            const x = player.position.x - selectedEntity.position.x + controls.lookDir.x;
            const y = player.position.y - selectedEntity.position.y + controls.lookDir.y;
            const z = player.position.z - selectedEntity.position.z + controls.lookDir.z;

            const xr = -selectedEntity.rotation.x;
            const yr = -selectedEntity.rotation.y;
            const zr = -selectedEntity.rotation.z;
            VENTEA.Physics.setLinearVelocity(selectedEntity.handle, new VENTEA.Vector3(10 * x, 10 * y, 10 * z));
            VENTEA.Physics.setAngularVelocity(selectedEntity.handle, new VENTEA.Vector3(10 * xr, 10 * yr, 10 * zr));
        }
        VENTEA.Renderer.renderScene(scene, time, camera);

        requestAnimationFrame(render);
    }

    requestAnimationFrame(render);
})();
