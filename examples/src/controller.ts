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

    controls.target = player.position;

    const lol = 0.5;

    const count = 3;
    const boxMesh = new VENTEA.BoxMesh(lol, lol, lol);
    const sphereMesh = new VENTEA.SphereMesh(lol / 2);

    const texture = new VENTEA.Texture2D(4, 2);
    texture.setData(new Uint8Array([
        255, 102, 159, 255, 255, 159, 102, 255, 236, 255, 102, 255, 121, 255, 102, 255, 102, 255,
        198, 255, 102, 198, 255, 255, 121, 102, 255, 255, 236, 102, 255, 255
    ]));

    const boxMaterial = boxMesh.subMeshes[0].material!;
    boxMaterial.set('albedoTexture', texture);
    boxMaterial.build();

    const sphereMaterial = sphereMesh.subMeshes[0].material!;
    sphereMaterial.set('albedoTexture', texture);
    sphereMaterial.build();

    const random = (min: number, max: number) => Math.random() * (max - min) + min;

    const width = 20;
    const halfWidth = width/2;

    for(let y = 0; y < 4; y++) {
        for (let i = 0; i < count * count; i++) {
            const entity = scene.createEntity();
            entity.position.set(random(-halfWidth, halfWidth), 5, random(-halfWidth, halfWidth));

            if(Math.random() > 0.5) {
                entity.addComponent(VENTEA.MeshRenderer, sphereMesh);
                entity.addComponent(VENTEA.SphereCollider, { radius: lol/2 });
            } else {
                entity.addComponent(VENTEA.MeshRenderer, boxMesh);
                entity.addComponent(VENTEA.BoxCollider, { x: lol, y: lol, z: lol });
            }

            entity.addComponent(VENTEA.RigidBody, { type: VENTEA.BodyType.Dynamic });
        }
    }

    const floorMesh = new VENTEA.BoxMesh(width, 1, width);
    const floorMat = floorMesh.subMeshes[0].material!;
    floorMat.set('albedoTexture', texture);
    floorMat.build();

    const floor = scene.createEntity('Floor');
    floor.addComponent(VENTEA.MeshRenderer, floorMesh)
    .addComponent(VENTEA.BoxCollider, { x: width, y: 1, z: width })
    .addComponent(VENTEA.RigidBody, { type: VENTEA.BodyType.Static });

    const wallMesh = new VENTEA.BoxMesh(width, width, 1);
    const wall2Mesh = new VENTEA.BoxMesh(1, width, width);
    const wall1 = scene.createEntity();
    wall1.position.set(0, 0, halfWidth);
    wall1
    .addComponent(VENTEA.MeshRenderer, wallMesh)
    .addComponent(VENTEA.MeshCollider, wallMesh)
    .addComponent(VENTEA.RigidBody, { type: VENTEA.BodyType.Static });

    const wall2 = scene.createEntity();
    wall2.position.set(0, 0, -halfWidth);
    wall2
    .addComponent(VENTEA.MeshRenderer, wallMesh)
    .addComponent(VENTEA.MeshCollider, wallMesh)
    .addComponent(VENTEA.RigidBody, { type: VENTEA.BodyType.Static });

    const wall3 = scene.createEntity();
    wall3.position.set(halfWidth, 0, 0);
    wall3
    .addComponent(VENTEA.MeshRenderer, wall2Mesh)
    .addComponent(VENTEA.MeshCollider, wall2Mesh)
    .addComponent(VENTEA.RigidBody, { type: VENTEA.BodyType.Static });

    const wall4 = scene.createEntity();
    wall4.position.set(-halfWidth, 0, 0);
    wall4
    .addComponent(VENTEA.MeshRenderer, wall2Mesh)
    .addComponent(VENTEA.MeshCollider, wall2Mesh)
    .addComponent(VENTEA.RigidBody, { type: VENTEA.BodyType.Static });
    
    const mapMesh = await VENTEA.Resources.load(VENTEA.GLTFMesh, 'map.glb');
    const map = scene.createEntity('Map');
    map.position.set(-5, 0.5, 0);
    map.scale.set(0.75, 0.75, 0.75);
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

    let onGround = false;
    let selectedEntity: VENTEA.Entity | null = null;

    document.addEventListener('click', (e) => {
        if(selectedEntity) {
            if(e.button == 0) {
                const x = 10 * controls.lookDir.x;
                const y = 10 * controls.lookDir.y;
                const z = 10 * controls.lookDir.z;
                VENTEA.Physics.setLinearVelocity(selectedEntity.handle, new VENTEA.Vector3(x, y, z));
            }
            selectedEntity = null;
            return;
        }

        const position = new VENTEA.Vector3(player.position.x, player.position.y + 0.5, player.position.z);

        VENTEA.Physics.raycast(position, controls.lookDir, 100, (eid: number[]) => {
            for(const e of eid) {
                console.log(scene.pool[e]);
                if(e == player.handle) continue;
                if(VENTEA.RigidBody.type[e] == VENTEA.BodyType.Static) continue;

                selectedEntity = scene.pool[e];
                return;
            }
        });
    });

    const sun = scene.createEntity('Light');
    sun
    .addComponent(VENTEA.Light, { r: 2, g: 1.8, b: 1.4, type: VENTEA.LightType.Directional });
    sun.position.set(1, 1, 1);

    const sun2 = scene.createEntity('Light');
    sun2
    .addComponent(VENTEA.Light, { r: 2, g: 1.8, b: 1.4, type: VENTEA.LightType.Directional });
    sun2.position.set(-1, 1, -1);

    // const light2 = scene.createEntity('Light');
    // light2
    // .addComponent(VENTEA.MeshRenderer, new VENTEA.SphereMesh(0.1))
    // .addComponent(VENTEA.Light, { r: 0.1, g: 0.1, b: 0.1, type: VENTEA.LightType.Point });

    const render = (time: number) => {
        //TODO: ugly
        const alpha = VENTEA.Utils.clamp(50 * ((time - VENTEA.Physics.lastTime) / 1000), 0, 1);

        const xp = VENTEA.Utils.lerp(VENTEA.LastPosition.x[player.handle], player.position.x, alpha);
        const yp = VENTEA.Utils.lerp(VENTEA.LastPosition.y[player.handle], player.position.y, alpha);
        const zp = VENTEA.Utils.lerp(VENTEA.LastPosition.z[player.handle], player.position.z, alpha);

        controls.target = new VENTEA.Vector3(xp, yp + 0.5, zp);
        
        controls.update();

        // light2.position.set(3 * Math.cos(time / 1000), 1, 3 * Math.sin(time / 1000));

        VENTEA.Physics.raycast(player.position, new VENTEA.Vector3(0, -1, 0), 1.1, (eids: number[]) => {
            onGround = false;

            for(const e of eids) {
                if(e != player.handle) {
                    onGround = true;
                }
            }
        });

        const velocity = player.getComponent(VENTEA.Velocity);

        let newY = velocity!.y!;

        if(VENTEA.Input.isKeyDown('Space') && onGround) {
            newY = 4;
        }

        // const x = camera.target.x - player.position.x;
        // const z = camera.target.z - player.position.z;

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
        VENTEA.Physics.setLinearVelocity(player.handle, new VENTEA.Vector3(newX, newY, newZ));

        if(selectedEntity != null) {
            const x = player.position.x - selectedEntity.position.x + controls.lookDir.x;
            const y = player.position.y - selectedEntity.position.y + controls.lookDir.y + 0.5;
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
