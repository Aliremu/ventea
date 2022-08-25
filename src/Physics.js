let worker = null;
let data = [];
const loaded = w => new Promise(r => w.addEventListener("message", r, { once: true }));
let bodies = [];

let controller = [];
let lastController = [];

let fps = 0;

let lastTime = 0;

let scene = null;

let Ar = new Float32Array(50000);
let ready = false;

const SHAPES = {
    'box': 0,
    'sphere': 1,
    'capsule': 2,
    'mesh': 3
};

const BODY_TYPES = {
    'dynamic': 0,
    'static': 1,
    'kinematic': 2
};

import { defineQuery } from "../lib/bitECS/index.mjs";
import { RigidBody, Position, LastPosition, Size, Velocity, Rotation } from "./Components.js";

export class Physics {
    static fromShape(id) {
        return SHAPES[id];
    }

    static fromBodyType(id) {
        return BODY_TYPES[id];
    }

    static message(m) {
        let e = m.data;

        if(e.Ar) Ar = e.Ar;
        //console.log(m);
		Physics[e.m](e.o);
    }

    static post(e, buffer) {
        worker.postMessage( e, buffer );
    }

    static async init(o = {}) {

        if (worker) worker.terminate();

        worker = new Worker('./src/worker-physx.js');

        worker.postMessage = worker.webkitPostMessage || worker.postMessage;
		worker.onmessage = Physics.message;

        await loaded(worker);
    }

    static set(o={}) {
        scene = o.scene;

        Physics.post({ m:'init', o:o, Ar: Ar }, [Ar.buffer]);
    }

    static step(o ={}) {
        //console.log(o);
        lastController = controller;
        controller = o.controller;

        let size = Ar[0];
        lastTime = performance.now();

        for(let i = 1, count = 0; count < size; count++) {
            let eid = Ar[i];
            i+= 1;

            let pos = [ Ar[i], Ar[i+1], Ar[i+2] ];
            i += 3;

            let vel = [ Ar[i], Ar[i+1], Ar[i+2] ];
            i += 3;

            let rot = [ Ar[i], Ar[i+1], Ar[i+2], Ar[i+3] ];
            i += 4;

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
            Rotation.w[eid] = rot[3];

            //data.push( [pos, rot, size] );
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

    static add(o ={}) {
        let shape = o.shape ?? 'box';
        let pos = o.pos ?? [0, 0, 0];
        let rot = o.rot ?? [0, 0, 0, 1];
        let size = o.size ?? [1, 1, 1];
        let density = o.density ?? 1;
        let friction = o.friction ?? 0.5;
        let restitution = o.restitution ?? 0.2;
        let type = o.type ?? 'dynamic';
        let name = o.name ?? "" + Math.random();

        let entity = scene.createEntity(name);
        entity.addComponent(Position);
        entity.addComponent(Velocity);
        entity.addComponent(Size);
        entity.addComponent(RigidBody);

        Position.x[entity.handle] = pos[0];
        Position.y[entity.handle] = pos[1];
        Position.z[entity.handle] = pos[2];

        LastPosition.x[entity.handle] = pos[0];
        LastPosition.y[entity.handle] = pos[1];
        LastPosition.z[entity.handle] = pos[2];

        Velocity.x[entity.handle] = 0;
        Velocity.y[entity.handle] = 0;
        Velocity.z[entity.handle] = 0;

        Rotation.x[entity.handle] = rot[0];
        Rotation.y[entity.handle] = rot[1];
        Rotation.z[entity.handle] = rot[2];
        Rotation.w[entity.handle] = rot[3];

        Size.x[entity.handle] = size[0];
        Size.y[entity.handle] = size[1];
        Size.z[entity.handle] = size[2];

        RigidBody.shape[entity.handle] = SHAPES[shape];
        RigidBody.density[entity.handle] = density;
        RigidBody.type[entity.handle] = BODY_TYPES[type];

        o.eid = entity.handle;

        Physics.post({ m:'add', o:o });

        return entity;
    }

    static addedEntity(o={}) {
        
    }

    static addController(o = {}) {
        Physics.post({ m:'addController' });
    }
    
    static ready() {
        ready = true;
    }
}