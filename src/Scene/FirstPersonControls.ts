import { glMatrix } from "gl-matrix";
import { ICamera } from "../Camera/ICamera";
import { OrthographicCamera } from "../Camera/OrthographicCamera";
import { PerspectiveCamera } from "../Camera/PerspectiveCamera";
import { Utils } from "../Math/Utils";
import { Vector3 } from "../Math/Vector";
import { Vector3Proxy } from "./Components";

export class FirstPersonControls {
    public camera: ICamera;

    public keys: Map<string, boolean>;

    public lookDir: Vector3;

    public yaw: number;
    public pitch: number;

    public target?: Vector3 | Vector3Proxy;

    constructor(camera: ICamera) {
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

            if (camera instanceof PerspectiveCamera) {
                camera.pitch -= velY * Utils.DEG_TO_RAD;
                camera.yaw += velX * Utils.DEG_TO_RAD;

                // if (Math.abs(this.pitch) >= 90) {
                //     this.pitch = 90 * this.pitch / Math.abs(this.pitch);
                // }
    
                let r = Math.cos(camera.pitch);
    
                // let x = r * Math.sin(camera.yaw);
                // let y = Math.sin(camera.pitch);
                // let z = -r * Math.cos(camera.yaw);

                let x = Math.sin(camera.yaw);
                let y = Math.sin(camera.pitch);
                let z = -Math.cos(camera.yaw);

                this.lookDir.x = x;
                this.lookDir.y = y;
                this.lookDir.z = z;
            }
        });
    }

    update() {
        if (this.camera instanceof PerspectiveCamera || this.camera instanceof OrthographicCamera) {
            if(this.target) {
                this.camera.position.x = this.target.x;
                this.camera.position.y = this.target.y;
                this.camera.position.z = this.target.z;

                // this.camera.target.x = this.target.x + this.lookDir.x;
                // this.camera.target.y = this.target.y + this.lookDir.y;
                // this.camera.target.z = this.target.z + this.lookDir.z;

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

            this.camera.position.x += mult * velX;
            this.camera.position.y += velY;
            this.camera.position.z += mult * velZ;

            this.camera.target.x = this.camera.position.x + this.lookDir.x;
            this.camera.target.y = this.camera.position.y + this.lookDir.y;
            this.camera.target.z = this.camera.position.z + this.lookDir.z;

            this.camera.updateView();
        }
    }
}