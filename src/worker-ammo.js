var Module = { TOTAL_MEMORY: 512 * 1024 * 1024 };

importScripts('../lib/ammo/ammo.wasm.js');

var config = {
    locateFile: () => '../lib/ammo/ammo.wasm.wasm'
}

Ammo(config).then(function (Ammo) {
    let bodies = [];
    let interval = null;
    let timeout = null;
    let dynamicsWorld;

    let startTime = 0;
    let lastTime = 0;
    let timestep = 1 / 50;
    let substep = 10;

    let ghost = null;
    let controller = null;
    let ctrans = null;

    const CF_KINEMATIC_OBJECT = 2;
    const DISABLE_DEACTIVATION = 4;

    let fpsTime = 0;
    let fps = 0;

    let t = new Ammo.btTransform(); // taking this out of readBulletObject reduces the leaking

    class Engine {
        static init() {
            let collisionConfiguration = new Ammo.btDefaultCollisionConfiguration();
            let dispatcher = new Ammo.btCollisionDispatcher(collisionConfiguration);
            let overlappingPairCache = new Ammo.btDbvtBroadphase();
            let solver = new Ammo.btSequentialImpulseConstraintSolver();
            dynamicsWorld = new Ammo.btDiscreteDynamicsWorld(dispatcher, overlappingPairCache, solver, collisionConfiguration);
            dynamicsWorld.setGravity(new Ammo.btVector3(0, -9.81, 0));

            Engine.addController();
            timeout = Engine.step();
            //interval = setInterval(Engine.step, timestep * 1000);
        }

        static post(e, buffer) {
            postMessage(e, buffer);
        }

        static message(m) {
            let e = m.data;

            Engine[e.m](e.o);
        }

        static step() {
            startTime = performance.now();
            let dt = (startTime - lastTime) * 0.001;
            lastTime = startTime;
            fps++;

            if(lastTime - fpsTime >= 1000) {
                console.log(fps);
                fpsTime = lastTime;
                fps = 0;
            }

            dynamicsWorld.stepSimulation(timestep, substep, timestep / substep);

            let pos = [0, 0, 0];

            if (ghost) {
                ctrans = ghost.getWorldTransform().getOrigin();
                pos = [ctrans.x(), ctrans.y(), ctrans.z()];
            }

            var data = { objects: [], controller: pos };

            // Read bullet data into JS objects
            for (var i = 0; i < bodies.length; i++) {
                var object = [];
                Engine.read(i, object);
                data.objects[i] = object;
            }

            Engine.post({ m: 'step', o: data });
        }

        static poststep() {
            let delay = timestep * 1000 - (performance.now() - startTime);

            if (delay < 0) {
                Engine.step()
            } else {
                timeout = setTimeout(Engine.step, delay);
            }
        }

        static create(o = {}) {
            let type = o.type || 'box';
            let pos = o.pos || [0, 0, 0];
            let size = o.size || [1, 1, 1];
            let friction = o.friction ?? 0.5;
            let restitution = o.restitution ?? 0.2;
            let mass = o.density ?? 1;
            let kinematic = o.kinematic ?? false;

            let shape;

            switch (type) {
                case 'box': {
                    shape = new Ammo.btBoxShape(new Ammo.btVector3(size[0] / 2, size[1] / 2, size[2] / 2));
                    break;
                }
                case 'sphere': {
                    shape = new Ammo.btSphereShape(size[0]);
                    break;
                }
                case 'capsule': {
                    shape = new Ammo.btCapsuleShape(size[0] / 2, size[1]);
                    break;
                }
                default: {
                    shape = o.shape ?? new Ammo.btBoxShape(new Ammo.btVector3(size[0] / 2, size[1] / 2, size[2] / 2));
                    break;
                }
            }

            let transform = new Ammo.btTransform();
            transform.setIdentity();
            transform.setOrigin(new Ammo.btVector3(pos[0], pos[1], pos[2]));


            let localInertia = new Ammo.btVector3(0, 0, 0);
            shape.calculateLocalInertia(mass, localInertia)
            shape.setMargin(0.05);

            let myMotionState = new Ammo.btDefaultMotionState(transform);

            let rbInfo = new Ammo.btRigidBodyConstructionInfo(mass, myMotionState, shape, localInertia);
            let body = new Ammo.btRigidBody(rbInfo);
            body.setSleepingThresholds(0.01, 0.01);
            body.setFriction(friction);
            body.setRestitution(restitution);

            if (type == 'capsule') {
                body.setAngularFactor(new Ammo.btVector3(0, 1, 0));
            }

            if (kinematic) {
                body.setCollisionFlags(body.getCollisionFlags() | CF_KINEMATIC_OBJECT);
                body.setActivationState(DISABLE_DEACTIVATION);
            }

            body.type = type;
            return body;
        }

        static add(o = {}) {
            let body = Engine.create(o);

            dynamicsWorld.addRigidBody(body);

            bodies.push(body);
        }

        static addGround(o = {}) {
            let width = o.width ?? 0;
            let depth = o.depth ?? 0;
            let heightData = o.heightData ?? 0;
            let heightScale = o.heightScale ?? 1;
            let minHeight = o.minHeight ?? 0;
            let maxHeight = o.maxHeight ?? 128;
            let upAxis = o.upAxis ?? 1;
            let hdt = o.hdt || 'PHY_FLOAT';
            let flipQuadEdges = o.flipQuadEdges ?? false;

            let ammoHeightData = Ammo._malloc(4 * width * depth);
            let p = 0;
            let p2 = 0;
                for (var i = 0; i < depth; i++) {
                    for (var j = 0; j < width; j++) {

                    // write 32-bit float data to memory
                    Ammo.HEAPF32[ammoHeightData + p2 >> 2] = heightData[p];

                    p++;

                    // 4 bytes/float
                    p2 += 4;

                }

            }


            const heightFieldShape = new Ammo.btHeightfieldTerrainShape(
                width,
                depth,
                ammoHeightData,
                heightScale,
                minHeight,
                maxHeight,
                upAxis,
                hdt,
                flipQuadEdges
            );

            heightFieldShape.setMargin(0.05);

            let transform = new Ammo.btTransform();
            transform.setIdentity();
            transform.setOrigin(new Ammo.btVector3(0, (minHeight + maxHeight) / 2, 0));


            let localInertia = new Ammo.btVector3(0, 0, 0);
            heightFieldShape.calculateLocalInertia(0, localInertia);

            let myMotionState = new Ammo.btDefaultMotionState(transform);

            let rbInfo = new Ammo.btRigidBodyConstructionInfo(0, myMotionState, heightFieldShape, localInertia);
            let body = new Ammo.btRigidBody(rbInfo);
            body.setCcdMotionThreshold(1);
            body.setCcdSweptSphereRadius(0.2);
            //body.setFriction(0.2);
            //body.setRestitution(0.2);

            dynamicsWorld.addRigidBody(body);
        }

        static addController(o = {}) {
            const shape = new Ammo.btCapsuleShape(1, 2);

            ghost = new Ammo.btPairCachingGhostObject();
            const transform = new Ammo.btTransform();
            transform.setIdentity();
            transform.setOrigin(new Ammo.btVector3(-20.0, 100.0, 0.0));
            //transform.setRotation(new Ammo.btQuaternion(0, 0, 0, 1));
            ghost.setWorldTransform(transform);
            ghost.setCollisionShape(shape);
            ghost.setCollisionFlags(16);
            ghost.setActivationState(4);
            ghost.setFriction(0.1);
            ghost.setRestitution(0);
            ghost.activate(true);

            controller = new Ammo.btKinematicCharacterController(ghost, shape, 1.5, 1);
            controller.setUseGhostSweepTest(true);

            controller.setGravity(9.81);
            // it falls through the ground if I apply gravity
            //controller.setGravity(-dynamicsWorld.getGravity().y())

            // move slowly to the right
            controller.setWalkDirection(new Ammo.btVector3(0, 0, 0));


            // addCollisionObject(collisionObject: Ammo.btCollisionObject, collisionFilterGroup?: number | undefined, collisionFilterMask?: number | undefined): void
            dynamicsWorld.addCollisionObject(ghost, 1, -1);
            dynamicsWorld.addAction(controller);
            dynamicsWorld.getBroadphase().getOverlappingPairCache().setInternalGhostPairCallback(new Ammo.btGhostPairCallback());

            //bodies.push(ghost);

            console.log(ghost);
        }

        static move(o = {}) {
            let x = 0;
            let y = 0;
            let z = 0;

            if (o.key) {
                let key = o.key ?? 0;
                let pressed = o.pressed ?? false;

                let walkSpeed = 0.1;

                if (pressed) switch (key) {
                    case 'w': z = 1; break;
                    case 's': z = -1; break;
                    case 'a': x = 1; break;
                    case 'd': x = -1; break;
                }

                z *= walkSpeed;
                x *= walkSpeed;
            }

            if (o.dir) {
                let dir = o.dir;
                x = dir[0] / 2;
                if (controller.canJump()) {
                    y = dir[1] / 2;
                }
                z = dir[2] / 2;
            }

            controller.setWalkDirection(new Ammo.btVector3(x, 0, z));

            //console.log(key, pressed);
        }

        static read(i, object) {

            let body = bodies[i];
            let types = ['box', 'sphere', 'capsule'];
            object[0] = types.indexOf(body.type);

            body.getMotionState().getWorldTransform(t);

            let origin = t.getOrigin();
            object[1] = origin.x();
            object[2] = origin.y();
            object[3] = origin.z();
            let rotation = t.getRotation();
            object[4] = rotation.x();
            object[5] = rotation.y();
            object[6] = rotation.z();
            object[7] = rotation.w();

        }
    }

    onmessage = Engine.message;

    Engine.post({ m: 'ready', o: {} });
});