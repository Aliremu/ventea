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
        physics: true 
    });

    const camera = new VENTEA.PerspectiveCamera(90, canvas.width / canvas.height, 0.01, 1000.0);
    // camera.eye.set(-5, 0, 0);

    const resume = await VENTEA.Resources.load(VENTEA.Texture2D, 'resume.png');
    const skyboxTexture = await VENTEA.Resources.load(VENTEA.Texture2D, 'FS003_Day_Sunless.png');
    const sponzaMesh = await VENTEA.Resources.load(VENTEA.GLTFMesh, 'Mesher.glb');
    console.log(sponzaMesh);
    // sponzaMesh.recalculateNormals();
    // const testMesh = new VENTEA.GLTFMesh(await VENTEA.Resources.load(VENTEA.GLTFMesh, 'Venti.glb'));

    const controls = new VENTEA.FirstPersonControls(camera);
    // const controls = new VENTEA.OrbitControls(camera);
    controls.update();

    const scene = new VENTEA.Scene();

    const skybox = scene.createEntity('Skybox');
    const skyboxMesh = new VENTEA.SphereMesh(500);
    skyboxMesh.subMeshes[0].material?.set('albedoTexture', skyboxTexture);
    skyboxMesh.subMeshes[0].material?.build();
    skybox.addComponent(VENTEA.MeshRenderer, skyboxMesh);
    skybox.position.set(0, 20, 0);
    skybox.rotation.set(0, 0, Math.PI);

    /*const skybox = scene.createEntity('Skybox');
    const skyboxMesh = new VENTEA.SphereMesh(10);
    const skyboxMat = skyboxMesh.subMeshes[0].material!;
    skyboxMat.set('albedoTexture', resume);
    skyboxMat.build();

    skybox
    .addComponent(VENTEA.MeshRenderer, skyboxMesh);*/

    scene.createEntity('Grid').addComponent(VENTEA.MeshRenderer, new VENTEA.GridMesh(1000, 1000));

    const player = scene.createEntity('Player');
    player.position.set(0, 10, 0);
    const playerMesh = new VENTEA.SphereMesh(0.5);
    playerMesh.subMeshes[0].material!.set('albedoTexture', resume);
    playerMesh.subMeshes[0].material!.build();
    player
    // .addComponent(VENTEA.MeshRenderer, playerMesh)
    .addComponent(VENTEA.SphereCollider, { radius: 0.5 })
    .addComponent(VENTEA.RigidBody, { type: VENTEA.BodyType.Dynamic });

    controls.target = player.position;

    const mesh = new VENTEA.BoxMesh(100, 1, 100);
    const material = mesh.subMeshes[0].material!;
    // material.set('albedoTexture', resume);
    material.build();

    const lol = 0.5;

    // const boxMesh = new VENTEA.BoxMesh(lol, lol, lol);
    const boxMesh = new VENTEA.SphereMesh(lol/2);
    const sphere = new VENTEA.SphereMesh(0.5);
    const boxMaterial = boxMesh.subMeshes[0].material!;
    const texture = new VENTEA.Texture2D(4, 2);
    texture.setData(new Uint8Array([
        255, 102, 159, 255, 255, 159, 102, 255, 236, 255, 102, 255, 121, 255, 102, 255, 102, 255,
        198, 255, 102, 198, 255, 255, 121, 102, 255, 255, 236, 102, 255, 255
    ]));
    boxMaterial.set('albedoTexture', texture);
    boxMaterial.build();

    const size = 20;
    for(let y = 0; y < 3; y++) {
        for (let i = 0; i < size * size; i++) {
            const entity = scene.createEntity();
            entity.position.set(~~(i / size) * lol, 20 + y * lol, (i % size) * lol);
            
            entity
            .addComponent(VENTEA.MeshRenderer, boxMesh)
            .addComponent(VENTEA.SphereCollider, { radius: lol/2 })
            .addComponent(VENTEA.RigidBody, { type: VENTEA.BodyType.Dynamic });
        }
    }

    

    const entity = scene.createEntity();
    entity.position.set(0, 1, 0);
        
    entity
        .addComponent(VENTEA.MeshRenderer, sphere)
        .addComponent(VENTEA.SphereCollider, { radius: 0.5 })
        .addComponent(VENTEA.RigidBody, { type: VENTEA.BodyType.Dynamic });

    const sponza = scene.createEntity('Ground');
    sponza.position.set(0, -50, 0);
    sponza.scale.set(10, 10, 10);
    sponza
        .addComponent(VENTEA.MeshRenderer, sponzaMesh)
        .addComponent(VENTEA.MeshCollider, sponzaMesh)
        .addComponent(VENTEA.RigidBody, { type: VENTEA.BodyType.Static });

    const floorMesh = new VENTEA.BoxMesh(500, 1, 500);
    const floorMat = floorMesh.subMeshes[0].material!;
    floorMat.set('albedoTexture', texture);
    floorMat.build();

    const floor = scene.createEntity('Floor')
    .addComponent(VENTEA.MeshRenderer, floorMesh)
    .addComponent(VENTEA.BoxCollider, { x: 500, y: 1, z: 500 })
    .addComponent(VENTEA.RigidBody, { type: VENTEA.BodyType.Static });
    window.addEventListener('resize', (e) => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;

      camera.aspect = canvas.width / canvas.height;
      camera.updateProjection();

      VENTEA.Renderer.resize(window.innerWidth, window.innerHeight);
      console.log("A");
    });
    // video.play();

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
                if(e == player.handle || e == sponza.handle || e == floor.handle) continue;

                selectedEntity = scene.pool[e];
                return;
            }
        });
    });

    const render = (time: number) => {
        // video.unmute();
        // video.updateTexture();
        const alpha = VENTEA.Utils.clamp(50 * ((time - VENTEA.Physics.lastTime) / 1000), 0, 1);

        const xp = VENTEA.Utils.lerp(VENTEA.LastPosition.x[player.handle], player.position.x, alpha);
        const yp = VENTEA.Utils.lerp(VENTEA.LastPosition.y[player.handle], player.position.y, alpha);
        const zp = VENTEA.Utils.lerp(VENTEA.LastPosition.z[player.handle], player.position.z, alpha);
        // controls.target.x = xp;
        // controls.target.y = yp;
        // controls.target.z = zp;

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

        let newY = VENTEA.Velocity.y[player.handle];

        if(VENTEA.Input.isKeyDown('Space') && onGround) {
            newY = 2;
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

        if(VENTEA.Input.isMouseDown(0)) {
            VENTEA.Physics.raycast(player.position, controls.lookDir, 100, (eid: number[]) => {
                for(const e of eid) {
                    if(e == player.handle) continue;

                    // VENTEA.Physics.setLinearVelocity(e, new VENTEA.Vector3(0, 10, 0));
                }
            });
        }

        // VENTEA.Physics.addForce(player.handle, new VENTEA.Vector3(20 * velX, 0, 20 * velZ));
        const newX = VENTEA.Velocity.x[player.handle] / 2 + velX * 3;
        const newZ = VENTEA.Velocity.z[player.handle] / 2 + velZ * 3;
        VENTEA.Physics.setLinearVelocity(player.handle, new VENTEA.Vector3(newX, newY, newZ));

        if(selectedEntity != null) {
            const x = player.position.x - selectedEntity.position.x + 2 * controls.lookDir.x;
            const y = player.position.y - selectedEntity.position.y + 2 * controls.lookDir.y;
            const z = player.position.z - selectedEntity.position.z + 2 * controls.lookDir.z;

            const xr = -selectedEntity.rotation.x;
            const yr = -selectedEntity.rotation.y;
            const zr = -selectedEntity.rotation.z;
            VENTEA.Physics.setLinearVelocity(selectedEntity.handle, new VENTEA.Vector3(10 * x, 10 * y, 10 * z));
            VENTEA.Physics.setAngularVelocity(selectedEntity.handle, new VENTEA.Vector3(10 * xr, 10 * yr, 10 * zr));
        }

        // VENTEA.Physics.setPosition(sponza.handle, new VENTEA.Vec3(sponza.position.x + 0.1, sponza.position.y, sponza.position.z));
        // VENTEA.Physics.setLinearVelocity(player.handle, new VENTEA.Vec3(1, 0, 0));
        //VENTEA.Physics.setPosition(player.handle, new VENTEA.Vec3(camera.eye[0] + camera.target[0] * 3, camera.eye[1] - 2, camera.eye[2] + camera.target[2] * 3));
        VENTEA.Renderer.renderScene(scene, time, camera);

        requestAnimationFrame(render);
    }

    requestAnimationFrame(render);
})();
