import PX from "physx-js-webidl";
import { Vector2, Vector3, Vector4 } from "../Math/Vector";
import { Shape } from "./Shape";
import { BodyType } from "./BodyType";
import { CreateBodyDesc, SubMeshDesc } from "./PhysicsEnums";
import { assert } from "@loaders.gl/core";
import { math } from "..";
import { SubMesh } from "../Mesh/Mesh";
import { Vector3Proxy } from "../Scene/Components";
import { mat4, quat } from "gl-matrix";
import { Quat } from "../Math/Quat";

interface EntityBody {
    body: PX.PxRigidDynamic | PX.PxRigidStatic;
    eid: number;
};

// @ts-nocheck

const quatToEuler = (quat: PX.PxQuat) => {
    let x = quat.x,
        y = quat.y,
        z = quat.z,
        w = quat.w,
        x2 = x * x,
        y2 = y * y,
        z2 = z * z,
        w2 = w * w;
    const m11 = 1 - 2 * (y * y + z * z);
    const m12 = 2 * (x * y + z * w);
    const m13 = 2 * (x * z - w * y);

    const m21 = 2 * (x * y - z * w);
    const m22 = 1 - 2 * (x * x + z * z);
    const m23 = 2 * (y * z + x * w);

    const m31 = 2 * (x * z + y * w);
    const m32 = 2 * (y * z - x * w);
    const m33 = 1 - 2 * (x * x + y * y);

    let out = new Vector3(0, 0, 0);

    out.y = -Math.asin(-m31);

    if (Math.abs(m31) < 0.9999999) {
        out.x = -Math.atan2(m32, m33);
        out.z = -Math.atan2(m21, m11);
    } else {
        out.x = 0;
        out.z = -Math.atan2(-m12, m22);
    }
    // TODO: Return them as degrees and not as radians
    return out;
}

namespace Engine {
    export let PhysX: typeof PX = null!;

    let version: number;
    let defaultErrorCallback: PX.PxDefaultErrorCallback;
    let allocator: PX.PxDefaultAllocator;
    let foundation: PX.PxFoundation;
    let physics: PX.PxPhysics;
    let cooking: PX.PxCooking;
    let manager: PX.PxControllerManager;
    let scene: PX.PxScene;
    let timeout: NodeJS.Timeout;

    let Ar: Float32Array;

    let bodies: Array<EntityBody> = new Array();

    let substep: number = 2;
    let tps: number = 50;
    let timestep: number = 1 / tps;
    let startTime: number = 0;
    let lastTime: number = 0;
    let fpsTime: number = 0;
    let fps: number = 0;
    let timeScale: number = 1;

    export const init = (m: any) => {
        // @ts-ignore
        version = PhysX.PxTopLevelFunctions.prototype.PHYSICS_VERSION;

        allocator = new PhysX.PxDefaultAllocator();
        defaultErrorCallback = new PhysX.PxDefaultErrorCallback();

        const tolerances = new PhysX.PxTolerancesScale();
        const cookingParams = new PhysX.PxCookingParams(tolerances);

        // @ts-ignore
        foundation = PhysX.PxTopLevelFunctions.prototype.CreateFoundation(version, allocator, defaultErrorCallback);
        // @ts-ignore
        physics = PhysX.PxTopLevelFunctions.prototype.CreatePhysics(version, foundation, tolerances);
        // @ts-ignore
        cooking = PhysX.PxTopLevelFunctions.prototype.CreateCooking(version, foundation, cookingParams);

        // create scene
        const gravity = new PhysX.PxVec3(0, -9.81, 0);
        const sceneDesc = new PhysX.PxSceneDesc(tolerances);

        sceneDesc.gravity = gravity;
        // @ts-ignore
        sceneDesc.cpuDispatcher = PhysX.PxTopLevelFunctions.prototype.DefaultCpuDispatcherCreate(0);
        // @ts-ignore
        sceneDesc.filterShader = PhysX.PxTopLevelFunctions.prototype.DefaultFilterShader();
        scene = physics.createScene(sceneDesc);

        PhysX.destroy(sceneDesc);
        PhysX.destroy(gravity);
        PhysX.destroy(cookingParams);
        PhysX.destroy(tolerances);
    }

    export const start = (m: any) => {
        timeout = setTimeout(Engine.step, 0);
    }
    export const createMesh = (vertices: Float32Array, indices: Uint32Array, subMesh: SubMeshDesc, scale: Vector3) => {
        const points = new PhysX.Vector_PxVec3();
        const triangles = new PhysX.Vector_PxU32();

        for (let i = 0; i < subMesh.indexCount; i++) {
            const x = vertices[(i + subMesh.baseVertex) * 3 + 0];
            const y = vertices[(i + subMesh.baseVertex) * 3 + 1];
            const z = vertices[(i + subMesh.baseVertex) * 3 + 2];
            // const p = points.at(i);
            // p.x = x;
            // p.y = y;
            // p.z = z;
            const p = new PhysX.PxVec3(x, y, z);
            points.push_back(p);
            //PhysX.destroy(p);
        }

        for (let i = 0; i < subMesh.indexCount; i++) {
            triangles.push_back(indices[i + subMesh.baseIndex]);
        }

        const desc = new PhysX.PxTriangleMeshDesc();
        desc.points.count = points.size();
        desc.points.stride = 12;
        desc.points.data = points.data();

        desc.triangles.count = triangles.size() / 3;
        desc.triangles.stride = 12;
        desc.triangles.data = triangles.data();

        const trimesh = cooking.createTriangleMesh(desc, physics.getPhysicsInsertionCallback());

        const meshScale = new PhysX.PxMeshScale(new PhysX.PxVec3(scale.x, scale.y, scale.z), new PhysX.PxQuat(0, 0, 0, 1));
        const geometry = new PhysX.PxTriangleMeshGeometry(trimesh, meshScale);

        PhysX.destroy(meshScale);
        PhysX.destroy(desc);
        PhysX.destroy(triangles);
        PhysX.destroy(points);

        return geometry;
    }

    export const createFromGeometry = (o: any, geometry: PX.PxGeometry) => {
        const material = physics.createMaterial(o.friction, o.friction, o.restitution);

        // @ts-ignore
        const shapeFlags = new PhysX.PxShapeFlags(PhysX._emscripten_enum_PxShapeFlagEnum_eSCENE_QUERY_SHAPE() | PhysX._emscripten_enum_PxShapeFlagEnum_eSIMULATION_SHAPE());

        // @ts-ignore
        const pose = new PhysX.PxTransform(PhysX._emscripten_enum_PxIDENTITYEnum_PxIdentity());
        const pos = o.position;
        pose.p.x = pos.x;
        pose.p.y = pos.y;
        pose.p.z = pos.z;

        const simulationFilter = new PhysX.PxFilterData(1, 1, 0, 0);
        const queryFilter = new PhysX.PxFilterData(o.eid, 1, 0, 0);

        const shape = physics.createShape(geometry as PX.PxGeometry, material, true, shapeFlags);

        if (o.shape == Shape.Capsule) {
            const relativePose = new PhysX.PxTransform(new PhysX.PxVec3(), new PhysX.PxQuat(0, 0, Math.SQRT1_2, Math.SQRT1_2));
            shape.setLocalPose(relativePose);
            PhysX.destroy(relativePose);
        }

        let body;

        if (o.type == BodyType.Static) {
            body = physics.createRigidStatic(pose);
        } else {
            body = physics.createRigidDynamic(pose);
            if (o.type == BodyType.Kinematic) {
                // @ts-ignore
                const bodyFlags = new PhysX.PxRigidBodyFlags(PhysX._emscripten_enum_PxRigidBodyFlagEnum_eKINEMATIC());
                body.setRigidBodyFlags(bodyFlags);

                PhysX.destroy(bodyFlags);
            }
        }

        shape.setSimulationFilterData(simulationFilter);
        shape.setQueryFilterData(queryFilter);
        body.attachShape(shape);
        scene.addActor(body);

        const entityBody: EntityBody = {
            body: body,
            eid: o.eid!
        };

        PhysX.destroy(queryFilter);
        PhysX.destroy(simulationFilter);
        PhysX.destroy(pose);
        PhysX.destroy(shapeFlags);
        PhysX.destroy(geometry);

        bodies.push(entityBody);
    }

    export const create = (o: CreateBodyDesc) => {
        let geometry;
        Object.setPrototypeOf(o.position, Vector3.prototype);
        Object.setPrototypeOf(o.rotation, Vector3.prototype);

        switch (o.shape) {
            case Shape.Box:
                Object.setPrototypeOf(o.scale, Vector3.prototype);

                const scale = o.scale as Vector3;
                geometry = new PhysX.PxBoxGeometry(scale.x / 2, scale.y / 2, scale.z / 2);
                createFromGeometry(o, geometry);
                break;
            case Shape.Sphere:
                const radius = o.scale as number;
                geometry = new PhysX.PxSphereGeometry(radius);
                createFromGeometry(o, geometry);
                break;
            case Shape.Capsule:
                Object.setPrototypeOf(o.scale, Vector2.prototype);

                const size = o.scale as Vector2;
                geometry = new PhysX.PxCapsuleGeometry(size.x, size.y);
                createFromGeometry(o, geometry);
                break;
            case Shape.Mesh:
                if (!o.mesh)
                    throw new Error("");

                Object.setPrototypeOf(o.scale, Vector3.prototype);

                const vertices = o.mesh.vertices;
                const indices = o.mesh.indices;

                for (const subMesh of o.mesh.subMeshes) {
                    geometry = createMesh(vertices, indices, subMesh, o.scale as Vector3);
                    createFromGeometry(o, geometry);
                }
                break;
        }
    }

    export const step = (m: any) => {
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
        while (n--) {
            // controller.update();
            scene.simulate(timestep / substep * timeScale);
            scene.fetchResults(true);
        }
        let i = 1;
        let size = 0;

        for (const entityBody of bodies) {
            const body = entityBody.body;
            const transform = body.getGlobalPose();

            let t = transform.p;
            let r = new Quat(transform.q.x, transform.q.y, transform.q.z, transform.q.w).getEuler();
            let v = body instanceof PhysX.PxRigidBody ? body.getLinearVelocity() : transform.p;
            // debugger;
            Ar[i++] = entityBody.eid;

            Ar[i++] = t.x;
            Ar[i++] = t.y;
            Ar[i++] = t.z;

            Ar[i++] = v.x;
            Ar[i++] = v.y;
            Ar[i++] = v.z;

            Ar[i++] = r.x;
            Ar[i++] = r.y;
            Ar[i++] = r.z;

            size++;
        }

        Ar[0] = size;

        Engine.post({ m: 'step', Ar: Ar }, [Ar.buffer]);
    }

    export const poststep = () => {
        let delay = timestep * 1000 - (performance.now() - startTime);

        if (delay < 0) {
            Engine.step({});
        } else {
            timeout = setTimeout(Engine.step, delay);
        }
        //scene.simulate(1.0 / 60.0);
        //scene.fetchResults(true);
    }

    export const setPosition = (o: any) => {
        Object.setPrototypeOf(o.position, Vector3.prototype);

        const p = new PhysX.PxVec3();
        const q = new PhysX.PxQuat(0, 0, 0, 1);
        const t = new PhysX.PxTransform();

        t.q = q;

        for (const entityBody of bodies) {
            if (entityBody.eid == o.eid) {
                p.x = o.position.x;
                p.y = o.position.y;
                p.z = o.position.z;

                t.p = p;
                entityBody.body.setGlobalPose(t, true);
            }
        }

        PhysX.destroy(t);
        PhysX.destroy(q);
        PhysX.destroy(p);
    }

    export const setLinearVelocity = (o: any) => {
        Object.setPrototypeOf(o.velocity, Vector3.prototype);

        const v = new PhysX.PxVec3(o.velocity.x, o.velocity.y, o.velocity.z);

        for (const entityBody of bodies) {
            if (entityBody.eid == o.eid) {
                if (entityBody.body instanceof PhysX.PxRigidBody) {
                    entityBody.body.setLinearVelocity(v, true);
                }
            }
        }

        PhysX.destroy(v);
    }

    export const setAngularVelocity = (o: any) => {
        Object.setPrototypeOf(o.velocity, Vector3.prototype);

        const v = new PhysX.PxVec3(o.velocity.x, o.velocity.y, o.velocity.z);

        for (const entityBody of bodies) {
            if (entityBody.eid == o.eid) {
                if (entityBody.body instanceof PhysX.PxRigidBody) {
                    entityBody.body.setAngularVelocity(v, true);
                }
            }
        }

        PhysX.destroy(v);
    }

    export const addForce = (o: any) => {
        Object.setPrototypeOf(o.force, Vector3.prototype);

        const f = new PhysX.PxVec3(o.force.x, o.force.y, o.force.z);

        for (const entityBody of bodies) {
            if (entityBody.eid == o.eid) {
                if (entityBody.body instanceof PhysX.PxRigidBody) {
                    entityBody.body.addForce(f);
                }
            }
        }

        PhysX.destroy(f);
    }

    export interface RaycastDesc {
        origin: Vector3;
        direction: Vector3;
        distance: number;
        uid: number;
    }

    export const raycast = (o: RaycastDesc) => {
        if (o.origin.buffer) {
            Object.setPrototypeOf(o.origin, Vector3.prototype);
        } else {
            Object.setPrototypeOf(o.origin, Vector3Proxy.prototype);
        }

        Object.setPrototypeOf(o.direction, Vector3.prototype);

        // let buffer = PhysX.allocateRaycastHitBuffers(1);
        // let filter = new PhysX.PxFilterData(1, 1, 0, 0);
        // let filterData = new PhysX.PxQueryFilterData();
        // //filterData.data = filter;
        // filterData.flags = new PhysX.PxQueryFlags(PhysX.PxQueryFlag.eDYNAMIC.value);// | PhysX.PxQueryFlag.eDYNAMIC.value);

        // let wtf = PhysX.PxRaycastCallback.implement({
        //     processTouches: (obj) => {
        //         //console.log(obj.getShape().getQueryFilterData().word0);        
        //     }
        // }, buffer, 1);

        // const status = scene.raycast(o.origin, o.direction, o.distance, wtf, new PhysX.PxHitFlags(PhysX.PxHitFlag.eDEFAULT.value), filterData, null, null);

        // const eid = status ? buffer.getShape().getQueryFilterData().word0 : -1;

        const rayBuffer = new PhysX.PxRaycastBuffer10();
        // @ts-ignore
        const rayFlags = new PhysX.PxHitFlags(PhysX._emscripten_enum_PxHitFlagEnum_eDEFAULT());
        const rayFilter = new PhysX.PxQueryFilterData();

        const origin = new PhysX.PxVec3(o.origin.x, o.origin.y, o.origin.z);
        const direction = new PhysX.PxVec3(o.direction.x, o.direction.y, o.direction.z);

        const status = scene.raycast(origin, direction, o.distance, rayBuffer, rayFlags, rayFilter);
        // console.log(hit);
        let eids = [];
        for (let i = 0; i < rayBuffer.getNbAnyHits(); i++) {
            const r = rayBuffer.getAnyHit(i);
            eids.push(r.shape.getQueryFilterData().word0);
            // console.log(r);
        }

        //const eid = hit && rayBuffer.getNbAnyHits() > 1 ? rayBuffer.getAnyHit(1).shape.getQueryFilterData().word0 : -1;



        PhysX.destroy(direction);
        PhysX.destroy(origin);
        PhysX.destroy(rayFilter);
        PhysX.destroy(rayFlags);
        PhysX.destroy(rayBuffer);

        Engine.post({ m: 'doneRaycast', o: { msg: eids, uid: o.uid } });
    }

    export const lockRotation = (o: any) => {
        for (const entityBody of bodies) {
            if (entityBody.eid == o.eid) {
                if (entityBody.body instanceof PhysX.PxRigidBody) {
                    // @ts-ignore
                    entityBody.body.setRigidDynamicLockFlags(new PhysX.PxRigidDynamicLockFlags(PhysX._emscripten_enum_PxRigidDynamicLockFlagEnum_eLOCK_ANGULAR_Z() | PhysX._emscripten_enum_PxRigidDynamicLockFlagEnum_eLOCK_ANGULAR_X() | PhysX._emscripten_enum_PxRigidDynamicLockFlagEnum_eLOCK_ANGULAR_Y()));
                }
            }
        }
    }

    export const message = (m: any) => {
        let e = m.data;

        if (e.Ar) Ar = e.Ar;

        (Engine as any)[e.m](e.o);
    }

    export const post = (e: any, buffer: Transferable[] = undefined!) => {
        postMessage(e, buffer);
    }
}

PX().then(function (physx: typeof PX) {
    Engine.PhysX = physx;
    onmessage = Engine.message;

    Engine.post({ m: 'ready', o: {} });
});


/*let version = null;
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
        );*//*

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
let filter = new PhysX.PxFilterData(1, 1, 0, 0);
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

this.vel.y -= 0.95 * timestep;
let controllerFilter = new PhysX.PxControllerFilters(null, null, null);
controllerFilter.mFilterFlags = new PhysX.PxQueryFlags(PhysX.PxQueryFlag.eSTATIC.value | PhysX.PxQueryFlag.eDYNAMIC.value);
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

const setupFiltering = function (shape, group, mask, eid) {
const filterData = new PhysX.PxFilterData(group, mask, 0, 0);
shape.setSimulationFilterData(filterData);
const filterData2 = new PhysX.PxFilterData(eid, 0, 0, 0);
shape.setQueryFilterData(filterData2);
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
Ar[i++] = s[2];*//*
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

static createConvex(o = {}) {
let vertPtr = PhysX._malloc(o.vertices.length * 4);

let p2 = 0;
for (let i = 0; i < o.vertices.length; i++) {
PhysX.HEAPF32[(vertPtr + p2) >> 2] = o.vertices[i]
p2 += 4;
}

const trimesh = cooking.createConvexMeshFromBuffer(vertPtr, o.vertices.length / 3, physics);

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
const geometry = new PhysX.PxConvexMeshGeometry(trimesh, meshScale, new PhysX.PxConvexMeshGeometryFlags(0));

PhysX._free(trimesh);
PhysX._free(vertPtr);

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

case 'convex': {
geometry = Engine.createConvex(o);
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
case 'kinematic': {
body = physics.createRigidDynamic(transform);
//console.log(PhysX.PxRigidBodyFlags.eKINEMATIC);
//body.setRigidDynamicFlag(PhysX.PxRigidBodyFlagEnum.eKINEMATIC.value, true);
body.setMass(density);
break;
}
default: {
body = physics.createRigidStatic(transform);
break;
}
}

setupFiltering(shape, 1, 1, eid);

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

setupFiltering(shape, 1, 1, eid);

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

static setGlobalPose(o={}) {
for(const body of bodies) {
if(body.eid == o.eid) {
const pose = {
    translation: o.translation,
    rotation: o.rotation
};

//console.log(body);

body.setGlobalPose(pose, true);
}
}
}

static setX(o={}) {
for(const body of bodies) {
if(body.eid == o.eid) {
const t = body.getGlobalPose();
t.translation.x = o.x;
const pose = {
    translation: t.translation,
    rotation: t.rotation
};

//console.log(body);

body.setGlobalPose(pose, false);
}
}
}

static setY(o={}) {
for(const body of bodies) {
if(body.eid == o.eid) {
const t = body.getGlobalPose();
t.translation.y = o.y;
const pose = {
    translation: t.translation,
    rotation: t.rotation
};

//console.log(body);
body.setGlobalPose(pose, false);
}
}
}

static setZ(o={}) {
for(const body of bodies) {
if(body.eid == o.eid) {
const t = body.getGlobalPose();
t.translation.z = o.z;
const pose = {
    translation: t.translation,
    rotation: t.rotation
};

body.setGlobalPose(pose, false);
}
}
}

static setLinearVelocity(o={}) {
for(const body of bodies) {
if(body.eid == o.eid) {
body.setLinearVelocity(o.velocity, true);
}
}
}

static setAngularVelocity(o={}) {
for(const body of bodies) {
if(body.eid == o.eid) {
body.setAngularVelocity(o.velocity, true);
}
}
}

static removeBody(o={}) {
let copy = [];

for(const body of bodies) {
if(body.eid == o.eid) {
scene.removeActor(body, true);
} else {
copy.push(body);
}
}

bodies = copy;
}

static raycast(o={}) {
let buffer = PhysX.allocateRaycastHitBuffers(1);
let filter = new PhysX.PxFilterData(1, 1, 0, 0);
let filterData = new PhysX.PxQueryFilterData();
//filterData.data = filter;
filterData.flags = new PhysX.PxQueryFlags(PhysX.PxQueryFlag.eDYNAMIC.value);// | PhysX.PxQueryFlag.eDYNAMIC.value);

let wtf = PhysX.PxRaycastCallback.implement({
processTouches: (obj) => {
//console.log(obj.getShape().getQueryFilterData().word0);        
}
}, buffer, 1);

const status = scene.raycast(o.origin, o.direction, o.distance, wtf, new PhysX.PxHitFlags(PhysX.PxHitFlag.eDEFAULT.value), filterData, null, null);

const eid = status ? buffer.getShape().getQueryFilterData().word0 : -1;

Engine.post({ m: 'doneRaycast', o: { msg: eid, uid: o.uid }});
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
})*/
