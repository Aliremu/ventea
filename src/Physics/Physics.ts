let worker: Worker;
const loaded = (w: Worker) => new Promise(r => w.addEventListener("message", r, { once: true }));
let bodies: any = [];

let controller: any = [];
let lastController: any = [];

let fps = 0;

let lastTime = 0;

let scene: Scene;

let Ar = new Float32Array(50000);

let queue: any = {};

import { defineQuery, Not } from "bitecs";
import { LastPosition, Position, RigidBody, Rotation, Vector3Proxy, Velocity } from '../Scene/Components';
import { Scene } from "../Scene/Scene";
// @ts-ignore
// import PhysXWorker from "worker-loader!./physx.worker";
// @ts-ignore
// import Wasm from "../../node_modules/physx-js-webidl/physx-js-webidl.wasm";
import { Vector3 } from "../Math/Vector";
// @ts-ignore
import PhysXWorker from "./physx.worker.ts";
// @ts-ignore

const notRigidBodyQuery = defineQuery([Not(RigidBody)]);

export class Physics {
    static isReady = false;
    static frameTime = 0;

    static message(m: any) {
        let e = m.data;

        if(e.Ar) Ar = e.Ar;
		(Physics as any)[e.m](e.o);
    }

    static post(e: any, buffer?: any) {
        if(!this.isReady) return;

        worker.postMessage( e, buffer );
    }

    static async init(o = {}) {

        if (worker) worker.terminate();

        // worker = new PhysXWorker();

        // worker = new Worker(new URL('./physx.worker.ts', import.meta.url), { type: 'module' });
  
        worker = new PhysXWorker();
        // console.log(TestWorker);
        // worker = new TestWorker();
        // worker = workerify(TestWorker);
        // console.log(await (await fetch("physx-js-webidl.wasm")).text());
        // console.log(Wasm);

        worker.postMessage = worker.postMessage;
		worker.onmessage = Physics.message;

        await loaded(worker);

        Physics.post({ m:'init', o:o, Ar: Ar }, [Ar.buffer]);
    }

    static set(o: any ={}) {
        scene = o.scene;

        Physics.post({ m:'start' });
    }

    static step(o: any = {}) {
        //console.log(o);
        lastController = controller;
        controller = o.controller;

        let size = Ar[0];
        const time = performance.now();

        this.frameTime = time - lastTime;
        
        lastTime = time;

        for(let i = 1, count = 0; count < size; count++) {
            let eid = Ar[i];
            i+= 1;

            let pos = [ Ar[i], Ar[i+1], Ar[i+2] ];
            i += 3;

            let vel = [ Ar[i], Ar[i+1], Ar[i+2] ];
            i += 3;

            let rot = [ Ar[i], Ar[i+1], Ar[i+2] ];
            i += 3;

            LastPosition.x[eid] = Position.x[eid];
            LastPosition.y[eid] = Position.y[eid];
            LastPosition.z[eid] = Position.z[eid];

            Position.x[eid] = pos[0];
            Position.y[eid] = pos[1];
            Position.z[eid] = pos[2];

            Velocity.x[eid] = vel[0];
            Velocity.y[eid] = vel[1];
            Velocity.z[eid] = vel[2];

            Rotation.x[eid] = rot[0];
            Rotation.y[eid] = rot[1];
            Rotation.z[eid] = rot[2];

            //data.push( [pos, rot, size] );
        }

        const notRigidBodies = notRigidBodyQuery(scene.world);

        for(const eid of notRigidBodies) {
            LastPosition.x[eid] = Position.x[eid];
            LastPosition.y[eid] = Position.y[eid];
            LastPosition.z[eid] = Position.z[eid];
        }

        Physics.post({ m:'poststep', Ar: Ar }, [Ar.buffer]);
    }

    static get lastTime() {
        return lastTime;
    }

    static get bodies() {
        return bodies;
    }

    static get controller() {
        return [lastController, controller];
    }

    static setLinearVelocity(entity: number, velocity: Vector3) {
        Physics.post({ m: 'setLinearVelocity', o: {
            eid: entity,
            velocity: velocity
        }});
    }

    static setAngularVelocity(entity: number, velocity: Vector3) {
        Physics.post({ m: 'setAngularVelocity', o: {
            eid: entity,
            velocity: velocity
        }});
    }

    static setPosition(entity: number, position: Vector3) {
        Physics.post({ m: 'setPosition', o: {
            eid: entity,
            position: position
        }});
    }

    static addForce(entity: number, force: Vector3) {
        Physics.post({ m: 'addForce', o: {
            eid: entity,
            force: force
        }});
    }

    static raycast(origin: Vector3 | Vector3Proxy, direction: Vector3, distance: number, callback: any) {
        const uid = Math.floor(Math.random() * 10000);

        const o = {
            origin: origin,
            direction: direction,
            distance: distance,
            uid: uid
        };

        queue[uid] = callback;

        Physics.post({ m: 'raycast', o: o });
    }

    static doneRaycast(o: any = {}) {
        queue[o.uid](o.msg);

        delete queue[o.uid];
    }

    static lockRotation(eid: number) {
        Physics.post({ m: 'lockRotation', o: { eid: eid } });
    }

    static removeBody(o={}) {
        Physics.post({ m: 'removeBody', o: o });
    }

    static addedEntity(o={}) {
        
    }

    static addController(o = {}) {
        Physics.post({ m:'addController' });
    }
    
    static ready() {
        this.isReady = true;
    }
}