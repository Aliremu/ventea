var Module = { INITIAL_MEMORY: 512 * 1024 * 1024 };

/*var config = {
    locateFile: () => '../lib/physx/physx.wasm.wasm'
}*/

importScripts('https://cdn.jsdelivr.net/npm/physx-js/dist/physx.release.js');

let version = null;
let defaultErrorCallback = null;
let allocator = null;
let foundation = null;
let physics = null;
let cooking = null;
let manager = null;
let scene = null;
let bodies = [];
let controller = null;

let startTime = 0;
let lastTime = 0;

let fps = 0;
let fpsTime = 0;
let substep = 2;

let timestep = 1 / 50;
let timeout = null;

let Ar = null;

console.log('ready');

const lerp = (a, b, t) => {
    const x = a.x * (1 - t) + b.x * t;
    const y = a.y * (1 - t) + b.y * t;
    const z = a.z * (1 - t) + b.z * t;

    return { x: x, y: y, z: z };
}

class Controller {
    controller = null;
    vel = { x: 0, y: 0, z: 0 };
    onGround = false;

    constructor() {
        manager = PhysX.PxCreateControllerManager(scene, false);

        const controllerDesc = new PhysX.PxCapsuleControllerDesc();
        controllerDesc.height = 1.0;
        controllerDesc.radius = 0.3;
        controllerDesc.stepOffset = 0.5;
        controllerDesc.contactOffset = 0.001;
        controllerDesc.slopeLimit = 0.5;
        let filter = new PhysX.PxFilterData(3, 3, 0, 0);
        /*controllerDesc.setReportCallback(
            PhysX.PxUserControllerHitReport.implement({
                onShapeHit: event => {
                },
                onControllerHit: event => {
                },
                onObstacleHit: event => {
                }
            })
        );*/

        controllerDesc.setMaterial(physics.createMaterial(0, 0, 0));

        if (!controllerDesc.isValid()) {
            console.warn('[WARN] Controller Description invalid!');
        }

        this.controller = manager.createController(controllerDesc);
        this.controller.setSimulationFilterData(filter);
        this.controller.setPosition({ x: 0, y: 100, z: 0 });
    }

    setVelocity(vel) {
        if (vel.y == 0) vel.y = this.vel.y;

        this.vel = lerp(this.vel, vel, 0.3);
        this.vel.y = vel.y;
    }

    update() {
        this.onGround = false;
        let buffer = PhysX.allocateSweepHitBuffers(3);
        let geometry = new PhysX.PxSphereGeometry(0.4);
        //let origin = this.controller.getPosition();
        let filter = new PhysX.PxFilterData(2, 2, 0, 0);
        let filterData = new PhysX.PxQueryFilterData();
        //filterData.data = filter;
        filterData.flags = new PhysX.PxQueryFlags(PhysX.PxQueryFlag.eSTATIC.value | PhysX.PxQueryFlag.eDYNAMIC.value);// | PhysX.PxQueryFlag.eDYNAMIC.value);
        let transform = { translation: this.controller.getFootPosition(), rotation: { x: 0, y: 0, z: 0, w: 1 } };
        let dir = { x: 0, y: -1, z: 0 };

        let status = false;

        let wtf = PhysX.PxSweepCallback.implement({
            processTouches: (obj) => {
                if (obj.getActor().$$.ptr != this.controller.getActor().$$.ptr) {
                    status = true;
                }
            }
        }, buffer, 3);

        let callback = PhysX.PxQueryFilterCallback.implement({
            preFilter: (d, s, a) => {
                console.log(d, s, a);

                return PhysX.PxQueryHitType.eBLOCK.value;
            }
        });

        scene.sweep(geometry, transform, dir, 0.1, wtf, new PhysX.PxHitFlags(PhysX.PxHitFlag.eDEFAULT.value), filterData, null, null, 0);

        this.vel.y -= 0.981 * timestep;
        let controllerFilter = new PhysX.PxControllerFilters(null, null, null);
        controllerFilter.mFilterFlags = new PhysX.PxQueryFlags(PhysX.PxQueryFlag.eSTATIC.value);
        this.controller.move(this.vel, 0, timestep, controllerFilter, null);

        if (status) {
            //console.log(status);
            this.onGround = true;
            this.vel.y = 0;
        }


        PhysX._free(filterData);
        PhysX._free(filter);
        PhysX._free(geometry);
        PhysX._free(buffer);
    }
}

const setupFiltering = function (shape, group, mask) {
    const filterData = new PhysX.PxFilterData(group, mask, 0, 0);
    shape.setSimulationFilterData(filterData);
    shape.setQueryFilterData(filterData);
};

class Engine {
    static init(o = {}) {
        version = PhysX.PX_PHYSICS_VERSION;
        defaultErrorCallback = new PhysX.PxDefaultErrorCallback();
        allocator = new PhysX.PxDefaultAllocator();
        const triggerCallback = {
            onContactBegin: () => { },
            onContactEnd: () => { },
            onContactPersist: () => { },
            onTriggerBegin: () => { },
            onTriggerEnd: () => { },
        };

        const physxSimulationCallbackInstance = PhysX.PxSimulationEventCallback.implement(
            triggerCallback
        );

        foundation = PhysX.PxCreateFoundation(version, allocator, defaultErrorCallback);
        physics = PhysX.PxCreatePhysics(version, foundation, new PhysX.PxTolerancesScale(), false, null);
        cooking = PhysX.PxCreateCooking(version, foundation, new PhysX.PxCookingParams(new PhysX.PxTolerancesScale()));

        PhysX.PxInitExtensions(physics, null);
        const sceneDesc = PhysX.getDefaultSceneDesc(physics.getTolerancesScale(), 0, physxSimulationCallbackInstance);
        scene = physics.createScene(sceneDesc);

        controller = new Controller();

        timeout = Engine.step();
    }

    static post(e, buffer) {
        postMessage(e, buffer);
    }

    static message(m) {
        let e = m.data;

        if (e.Ar) Ar = e.Ar;

        Engine[e.m](e.o);
    }

    static step() {
        startTime = performance.now();
        let dt = (startTime - lastTime) * 0.001;
        lastTime = startTime;
        fps++;

        if (lastTime - fpsTime >= 1000) {
            console.log(fps);
            fpsTime = lastTime;
            fps = 0;
        }

        let n = substep;
        //while (n--) {
        controller.update();
        scene.simulate(timestep, true);
        scene.fetchResults(true);
        //}
        let test = { controller: [0, 0, 0] };

        let i = 1;
        let size = 0;

        for (const body of bodies) {
            const transform = body.getGlobalPose();

            let t = transform.translation;
            let r = transform.rotation;
            let v = transform.translation;

            Ar[i++] = body.eid;

            Ar[i++] = t.x;
            Ar[i++] = t.y;
            Ar[i++] = t.z;

            Ar[i++] = v.x;
            Ar[i++] = v.y;
            Ar[i++] = v.z;

            Ar[i++] = r.x;
            Ar[i++] = r.y;
            Ar[i++] = r.z;
            Ar[i++] = r.w;

            /*Ar[i++] = s[0];
            Ar[i++] = s[1];
            Ar[i++] = s[2];*/
            size++;
        }

        Ar[0] = size;

        let cpos = controller.controller.getPosition();

        test.controller = [cpos.x, cpos.y + 0.95, cpos.z];

        Engine.post({ m: 'step', o: test, Ar: Ar }, [Ar.buffer]);
    }

    static poststep() {
        let delay = timestep * 1000 - (performance.now() - startTime);

        if (delay < 0) {
            Engine.step();
        } else {
            timeout = setTimeout(Engine.step, delay);
        }
    }

    static createMesh(o = {}) {
        let vertPtr = PhysX._malloc(o.vertices.length * 4);
        let indPtr = PhysX._malloc(o.indices.length * 4);

        let p2 = 0;
        for (let i = 0; i < o.vertices.length; i++) {
            PhysX.HEAPF32[(vertPtr + p2) >> 2] = o.vertices[i]
            p2 += 4;
        }

        p2 = 0;
        for (let i = 0; i < o.indices.length; i++) {
            PhysX.HEAPU32[(indPtr + p2) >> 2] = o.indices[i];
            p2 += 4;
        }

        const trimesh = cooking.createTriMesh(vertPtr, o.vertices.length, indPtr, o.indices.length / 3, false, physics);

        const transform = {
            translation: {
                x: 0,
                y: 0,
                z: 0
            },
            rotation: {
                w: 1,
                x: 0,
                y: 0,
                z: 0
            }
        };

        const meshScale = new PhysX.PxMeshScale({ x: 1, y: 1, z: 1 }, { x: 0, y: 0, z: 0, w: 1 });
        const geometry = new PhysX.PxTriangleMeshGeometry(trimesh, meshScale, new PhysX.PxMeshGeometryFlags(0));

        PhysX._free(trimesh);
        PhysX._free(vertPtr);
        PhysX._free(indPtr);

        return geometry;
    }

    static create(o = {}) {
        let shapeDesc = o.shape ?? 'box';
        let pos = o.pos ?? [0, 0, 0];
        let rot = o.rot ?? [0, 0, 0, 1];
        let size = o.size ?? [1, 1, 1];
        let density = o.density ?? 1;
        let friction = o.friction ?? 0.5;
        let restitution = o.restitution ?? 0.2;
        let type = o.type ?? 'dynamic';
        let eid = o.eid ?? 0;

        let geometry;

        switch (shapeDesc) {
            case 'box': {
                geometry = new PhysX.PxBoxGeometry(size[0] / 2, size[1] / 2, size[2] / 2);
                break;
            }

            case 'sphere': {
                geometry = new PhysX.PxSphereGeometry(size[0]);
                break;
            }

            case 'capsule': {
                geometry = new PhysX.PxCapsuleGeometry(0.5, 1.0);
                break;
            }

            case 'mesh': {
                geometry = Engine.createMesh(o);
                break;
            }

            default: {
                geometry = new PhysX.PxBoxGeometry(0.5, 0.5, 0.5);
                break;
            }
        }

        const material = physics.createMaterial(friction, friction, restitution);
        const flags = new PhysX.PxShapeFlags(
            PhysX.PxShapeFlag.eSCENE_QUERY_SHAPE.value |
            PhysX.PxShapeFlag.eSIMULATION_SHAPE.value
        );
        const shape = physics.createShape(geometry, material, false, flags);
        const transform = {
            translation: {
                x: pos[0],
                y: pos[1],
                z: pos[2]
            },
            rotation: {
                w: rot[3],
                x: rot[0],
                y: rot[1],
                z: rot[2]
            }
        };

        let body;

        switch (type) {
            case 'dynamic': {
                body = physics.createRigidDynamic(transform);
                body.setMass(density);
                break;
            }
            case 'static': {
                body = physics.createRigidStatic(transform);
                break;
            }
            default: {
                body = physics.createRigidStatic(transform);
                break;
            }
        }

        setupFiltering(shape, 1, 1);

        body.attachShape(shape);

        body.size = size;
        body.shape = shape;
        body.eid = eid;

        scene.addActor(body, null);

        return body;
    }

    static addMesh(o = {}) {
        let pos = o.pos ?? [0, 0, 0];
        let rot = o.rot ?? [0, 0, 0, 1];
        let size = o.size ?? [1, 1, 1];
        let density = o.density ?? 1;
        let friction = o.friction ?? 0.5;
        let restitution = o.restitution ?? 0.2;
        let type = o.type ?? 'dynamic';
        let eid = o.eid ?? 0;

        let indices = o.indices;

        for (const ind of indices) {
            o.indices = ind;
            let geometry = Engine.createMesh(o);

            const material = physics.createMaterial(friction, friction, restitution);
            const flags = new PhysX.PxShapeFlags(
                PhysX.PxShapeFlag.eSCENE_QUERY_SHAPE.value |
                PhysX.PxShapeFlag.eSIMULATION_SHAPE.value
            );
            const shape = physics.createShape(geometry, material, false, flags);
            const transform = {
                translation: {
                    x: pos[0],
                    y: pos[1],
                    z: pos[2]
                },
                rotation: {
                    w: rot[3],
                    x: rot[0],
                    y: rot[1],
                    z: rot[2]
                }
            };


            let body;

            switch (type) {
                case 'dynamic': {
                    body = physics.createRigidDynamic(transform);
                    body.setMass(density);
                    break;
                }
                case 'static': {
                    body = physics.createRigidStatic(transform);
                    break;
                }
                default: {
                    body = physics.createRigidStatic(transform);
                    break;
                }
            }

            setupFiltering(shape, 1, 1);

            body.attachShape(shape);

            body.size = size;
            body.shape = shape;
            body.eid = eid;

            scene.addActor(body, null);
            bodies.push(body);
        }
    }

    static add(o = {}) {
        let body = Engine.create(o);
        bodies.push(body);
    }

    static addGround(o = {}) {
        let width = o.width ?? 0;
        let depth = o.depth ?? 0;
        let heightData = o.heightData ?? 0;
        let heightScale = o.heightScale ?? 1;
        let minHeight = o.minHeight ?? 0;
        let maxHeight = o.maxHeight ?? 128;

        let vertPtr = PhysX._malloc(o.vertices.length * 3 * 4);
        let indPtr = PhysX._malloc(o.indices.length * 4);

        let p2 = 0;
        for (let i = 0; i < o.vertices.length; i++) {
            PhysX.HEAPF32[(vertPtr + p2) >> 2] = o.vertices[i][0];
            p2 += 4;

            PhysX.HEAPF32[(vertPtr + p2) >> 2] = o.vertices[i][1];
            p2 += 4;

            PhysX.HEAPF32[(vertPtr + p2) >> 2] = o.vertices[i][2];
            p2 += 4;
        }

        p2 = 0;
        for (let i = 0; i < o.indices.length; i++) {
            PhysX.HEAPU32[(indPtr + p2) >> 2] = o.indices[i];
            p2 += 4;
        }

        const trimesh = cooking.createTriMesh(vertPtr, o.vertices.length, indPtr, o.indices.length / 3, false, physics);
        console.log(trimesh);
        const transform = {
            translation: {
                x: 0,
                y: 0,
                z: 0
            },
            rotation: {
                w: 1,
                x: 0,
                y: 0,
                z: 0
            }
        };

        const meshScale = new PhysX.PxMeshScale({ x: 1, y: 1, z: 1 }, { x: 0, y: 0, z: 0, w: 1 });
        const geometry = new PhysX.PxTriangleMeshGeometry(trimesh, meshScale, new PhysX.PxMeshGeometryFlags(0));

        const material = physics.createMaterial(0, 0, 0);
        const flags = new PhysX.PxShapeFlags(
            PhysX.PxShapeFlag.eSCENE_QUERY_SHAPE.value |
            PhysX.PxShapeFlag.eSIMULATION_SHAPE.value
        );
        const shape = physics.createShape(geometry, material, false, flags);

        let body = physics.createRigidStatic(transform);
        setupFiltering(shape, 1, 2);
        body.attachShape(shape);
        scene.addActor(body, null);
        PhysX._free(trimesh);
        PhysX._free(vertPtr);
        PhysX._free(indPtr);
    }

    static move(o = {}) {
        let x = 0;
        let y = 0;
        let z = 0;

        if (o.dir) {
            let dir = o.dir;
            x = dir[0] / 2;
            y = dir[1] / 2;
            z = dir[2] / 2;
        }

        if (!controller.onGround) y = 0;

        controller.setVelocity({ x: x, y: y, z: z });
    }

    static read(i, object) {

    }
}

const PhysX = PHYSX({
    locateFile(path) {
        if (path.endsWith('.wasm')) {
            return '../lib/physx/physx.wasm.wasm';
        }
        return path;
    },

    onRuntimeInitialized() {
        console.log(PhysX);
        onmessage = Engine.message;

        Engine.post({ m: 'ready', o: {} });
    },
})