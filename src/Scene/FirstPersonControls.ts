import { glMatrix } from "gl-matrix";
import { Camera } from "../Camera/Camera";
import { OrthographicCamera } from "../Camera/OrthographicCamera";
import { PerspectiveCamera } from "../Camera/PerspectiveCamera";
import { Vector3 } from "../Math/Vector";
import { Vector3Proxy } from "./Components";

export class FirstPersonControls {
    public camera: Camera;

    public keys: Map<string, boolean>;

    public lookDir: Vector3;

    public yaw: number;
    public pitch: number;

    public target?: Vector3 | Vector3Proxy;

    constructor(camera: Camera) {
        this.camera = camera;
        this.keys = new Map<string, boolean>();
        this.yaw = 0;
        this.pitch = 0;
        this.lookDir = new Vector3(0, 0, 1);

        document.addEventListener('keydown', (e) => {
            this.keys.set(e.code, true);
        });

        document.addEventListener('keyup', (e) => {
            this.keys.set(e.code, false);
        });

        document.addEventListener('mousemove', (e) => {
            //if(!document.pointerLockElement) return;

            const velX = e.movementX / 10;
            const velY = e.movementY / 10;

            this.pitch -= velY;
            this.yaw += velX;

            if (Math.abs(this.pitch) >= 89) {
                this.pitch = 89 * this.pitch / Math.abs(this.pitch);
            }

            let r = Math.cos(glMatrix.toRadian(this.pitch));

            let x = r * Math.cos(glMatrix.toRadian(this.yaw));
            let y = Math.sin(glMatrix.toRadian(this.pitch));
            let z = r * Math.sin(glMatrix.toRadian(this.yaw));

            if (camera instanceof PerspectiveCamera) {
                this.lookDir.x = x;
                this.lookDir.y = y;
                this.lookDir.z = z;
            }
        });
    }

    update() {
        if (this.camera instanceof PerspectiveCamera || this.camera instanceof OrthographicCamera) {
            if(this.target) {
                this.camera.eye.x = this.target.x;
                this.camera.eye.y = this.target.y;
                this.camera.eye.z = this.target.z;

                this.camera.target.x = this.target.x + this.lookDir.x;
                this.camera.target.y = this.target.y + this.lookDir.y;
                this.camera.target.z = this.target.z + this.lookDir.z;

                this.camera.updateView();
                return;
            } 

            let velX = 0;
            let velY = 0;
            let velZ = 0;

            let mult = 0.2;

            //Left
            if (this.keys.get('KeyA')) {
                velX += this.lookDir.z;
                velZ -= this.lookDir.x;
            }
            //Right
            if (this.keys.get('KeyD')) {
                velX -= this.lookDir.z;
                velZ += this.lookDir.x;
            }

            if (this.keys.get('Space')) {
                velY = 0.1;
            }

            if (this.keys.get('ControlLeft')) {
                velY = -0.1;
            }

            if (this.keys.get('ShiftLeft')) {
                mult = 0.3;
            }

            //Backward
            if (this.keys.get('KeyS')) {
                velX -= this.lookDir.x;
                velZ -= this.lookDir.z;
            }
            if (this.keys.get('KeyW')) {
                velX += this.lookDir.x;
                velZ += this.lookDir.z;
            }

            if (velX != 0 || velZ != 0) {
                let magnitude = Math.sqrt(velX * velX + velZ * velZ);
                velX /= magnitude;
                velZ /= magnitude;
            }

            this.camera.eye.x += mult * velX;
            this.camera.eye.y += velY;
            this.camera.eye.z += mult * velZ;

            this.camera.target.x = this.camera.eye.x + this.lookDir.x;
            this.camera.target.y = this.camera.eye.y + this.lookDir.y;
            this.camera.target.z = this.camera.eye.z + this.lookDir.z;

            this.camera.updateView();
        }
    }
}