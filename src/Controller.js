import { glMatrix, mat2, mat3, mat4, vec2, vec3, vec4 } from '../lib/gl-matrix/index.js';
import { Physics } from './Physics.js';

export class Controller {
    #keys = {};
    #camera;
    #yaw;
    #pitch;
    #velX;
    #velY;
    #velZ;

    constructor(camera, surface) {
        this.#camera = camera;
        this.#yaw = 0;
        this.#pitch = 0;
        this.#velX = 0;
        this.#velY = 0;
        this.#velZ = 0;

        surface.bind('keydown', (e) => {
            this.#keys[e.code] = true;
        });

        surface.bind('keyup', (e) => {
            this.#keys[e.code] = false;
        });

        surface.bind('mousemove', (e) => {
            let velX = e.movementX / 10;
            let velY = e.movementY / 10;

            this.#pitch -= velY;
            this.#yaw += velX;

            if (Math.abs(this.#pitch) >= 89) {
                this.#pitch = 89 * this.#pitch / Math.abs(this.#pitch);
            }

            let r = Math.cos(glMatrix.toRadian(this.#pitch));

            let x = r * Math.cos(glMatrix.toRadian(this.#yaw));
            let y = Math.sin(glMatrix.toRadian(this.#pitch));
            let z = r * Math.sin(glMatrix.toRadian(this.#yaw));

            this.#camera.forward.x = x;
            this.#camera.forward.y = y;
            this.#camera.forward.z = z;
        })
    }

    update() {
        this.#velX = 0;
        this.#velY = 0;
        this.#velZ = 0;

        let mult = 0.3;

        //Left
        if (this.#keys['KeyA']) {
            this.#velX += this.#camera.forward.z;
            this.#velZ -= this.#camera.forward.x;
        }
        //Right
        if (this.#keys['KeyD']) {
            this.#velX -= this.#camera.forward.z;
            this.#velZ += this.#camera.forward.x;
        }

        if(this.#keys['Space']) {
            this.#velY = 0.5;
        }

        if(this.#keys['ShiftLeft']) {
            mult = 1;
        }

        //Backward
        if (this.#keys['KeyS']) {
            this.#velX -= this.#camera.forward.x;
            this.#velZ -= this.#camera.forward.z;
        }
        if (this.#keys['KeyW']) {
            this.#velX += this.#camera.forward.x;
            this.#velZ += this.#camera.forward.z;
        }

        if (this.#velX != 0 || this.#velZ != 0) {
            let magnitude = Math.sqrt(this.#velX * this.#velX + this.#velZ * this.#velZ);
            this.#velX /= magnitude;
            this.#velZ /= magnitude;
        }

        this.#camera.pos.x += mult * this.#velX;
        this.#camera.pos.y += this.#velY;;
        this.#camera.pos.z += mult * this.#velZ;

        Physics.post({ m: 'move', o: { dir: [mult * this.#velX, this.#velY, mult * this.#velZ]}});
    }

    get camera() {
        return this.#camera;
    }

    get vel() {
        return [this.#velX, this.#velY, this.#velZ];
    }
}