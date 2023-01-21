import RAPIER from 'https://cdn.skypack.dev/@dimforge/rapier3d-compat';
//import { RAPIER } from '../lib/rapier/rapier_wasm3d.js';
//var Module = { INITIAL_MEMORY: 512 * 1024 * 1024 };

var config = {
    locateFile: () => '../lib/rapier/rapier_wasm3d_bg.wasm'
}

let world = null;
let bodies = [];

let startTime = 0;
let lastTime = 0;

let timestep = 1 / 50;
let substep = 2;

let fps = 0;
let fpsTime = 0;

let timeout = null;

let controller = null;

let Ar = null;

const lerp = (a, b, t) => (1 - t) * a + t * b;

class Controller {
    pos = { x: 0, y: 100, z: 0 };
    vel = { x: 0, y: 0, z: 0 };
    body = null;
    onGround = false;

    HEIGHT = 1;
    RADIUS = 0.5;

    constructor() {
        /*let desc = RAPIER.RigidBodyDesc.kinematicPositionBased()
        .setTranslation(0, 100, 0)
        .setCcdEnabled(true);*/
        let desc = RAPIER.RigidBodyDesc.dynamic()
        .setTranslation(0, 100, 0)
        .setCcdEnabled(true)
        .setGravityScale(2);

        let body = world.createRigidBody(desc);
        let shape = RAPIER.ColliderDesc.capsule(this.HEIGHT, this.RADIUS)
        .setDensity(100000000)
        .setRestitution(0.0)
        .setFriction(1.0);
        world.createCollider(shape, body);

        this.body = body;
    }

    update() {
        this.onGround = false;
        /*const ray = new RAPIER.Ray(
            { x: 0, y: 0,  z: 0},
            { x: 0, y: -1, z: 0}
        )

        ray.origin = this.body.translation();
        //for(let i = 0; i < 10; i++) {
            let hit = world.intersectionsWithRay(ray, this.HEIGHT, false, (b) => {
                this.onGround = true;
            });
        //}

        console.log(this.onGround);*/

        this.pos = this.body.translation();
        let kek = this.body.linvel();
        let newVel = {
            x: this.vel.x,
            y: kek.y + this.vel.y, //lerp(kek.y + this.vel.y, kek.y + this.vel.y - 9.81 * timestep, 0.5),
            z: this.vel.z,
        }

        if(newVel.y > 0 && !this.onGround) {
            //newVel.y = 0.5 * newVel.y;
        }

        //console.log(this.vel, newVel);

        this.body.setLinvel(newVel);
        //this.body.setNextKinematicTranslation(nextPos);

        //this.vel.y -= 1 * timestep;
    }

    setWalkDirection(dir) {
        //if(dir.y == 0) dir.y = this.vel.y;

        this.vel = dir;
    }
}

class Engine {
    static init(o = {}) {
        world = new RAPIER.World({ x: 0.0, y: -9.81, z: 0.0 });
        world.timestep = timestep;
        //world.integrationParameters.maxCcdSubsteps = 4;
        controller = new Controller();

        timeout = Engine.step();
    }

    static post(e, buffer) {
        postMessage(e, buffer);
    }

    static message(m) {
        let e = m.data;

        if(e.Ar) Ar = e.Ar;

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
        world.step();
        controller.update();
        //}
        let test = { controller: [0, 0, 0] };

        let i = 1;
        let size = 0;

        for (const body of bodies) {
            let t = body.translation();
            let r = body.rotation();
            let v = body.linvel();
            //let s = body.size;

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

        let cpos = controller.pos;

        test.controller = [cpos.x, cpos.y, cpos.z];

        Engine.post({ m: 'step', o: test, Ar: Ar }, [Ar.buffer]);
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
        let shape = o.shape ?? 'box';
        let pos = o.pos ?? [0, 0, 0];
        let rot = o.rot ?? [0, 0, 0, 1];
        let size = o.size ?? [1, 1, 1];
        let density = o.density ?? 1;
        let friction = o.friction ?? 0.5;
        let restitution = o.restitution ?? 0.2;
        let type = o.type ?? 'dynamic';
        let eid = o.eid ?? 0;

        let colliderDesc;

        switch (shape) {
            case 'box': {
                colliderDesc = RAPIER.ColliderDesc.cuboid(size[0] / 2, size[1] / 2, size[2] / 2);
                break;
            }

            case 'sphere': {
                colliderDesc = RAPIER.ColliderDesc.ball(size[0]);
                break;
            }

            case 'capsule': {
                colliderDesc = RAPIER.ColliderDesc.capsule(1, 0.5);
                break;
            }

            default: {
                colliderDesc = RAPIER.ColliderDesc.cuboid(0.5, 0.5, 0.5);
                break;
            }
        }

        colliderDesc.setDensity(density);
        colliderDesc.setFriction(friction);
        colliderDesc.setRestitution(restitution);

        let desc = (type == 'dynamic' ? RAPIER.RigidBodyDesc.dynamic() : RAPIER.RigidBodyDesc.fixed())
            .setTranslation(pos[0], pos[1], pos[2])
            .setCanSleep(true)
            .setCcdEnabled(true);

        let body = world.createRigidBody(desc);
        let collider = world.createCollider(colliderDesc, body);
        body.size = size;
        body.shape = shape;
        body.eid = eid;

        return body;
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

        //console.log(heightData);
        //console.log(o.indices.reduce((max, v) => max >= v ? max : v, -Infinity));

        let shape = RAPIER.ColliderDesc.heightfield(depth - 1, width - 1, heightData, new RAPIER.Vector3(width, 1, depth));
        //let cum = new Float32Array(o.vertices.flat());
        //let cum2 = new Uint32Array(o.indices);

        //console.log(cum, cum2);

        //let shape = RAPIER.ColliderDesc.trimesh(cum, cum2);

        let desc = RAPIER.RigidBodyDesc.fixed()
            .setTranslation(0, 0, 0);

        let body = world.createRigidBody(desc);
        let collider = world.createCollider(shape, body);

        console.log(collider);
    }

    static move(o = {}) {
        let x = 0;
        let y = 0;
        let z = 0;

        /*if (o.key) {
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
        }*/

        if (o.dir) {
            let dir = o.dir;
            x = dir[0] / 2;
            z = dir[2] / 2;
        }

        controller.setWalkDirection({ x: 300 * x, y: 0, z: 300 * z });
    }

    static read(i, object) {

    }
}

RAPIER.init(config.locateFile).then(() => {
    onmessage = Engine.message;

    Engine.post({ m: 'ready' });
});