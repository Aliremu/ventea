import { glMatrix, vec3 } from "gl-matrix";
import { Camera } from "../Camera/Camera";
import { OrthographicCamera } from "../Camera/OrthographicCamera";
import { PerspectiveCamera } from "../Camera/PerspectiveCamera";
import { Vector3 } from "../Math/Vector";

export class OrbitControls {
    public camera: Camera;

    public mouseDown: boolean;
    public distance: number;

    private yaw: number;
    private pitch: number;

    public target: Vector3;

    constructor(camera: Camera) {
        this.camera = camera;
        this.mouseDown = false;
        this.yaw = 0;
        this.pitch = 0;
        this.distance = 0;
        this.target = new Vector3();

        document.addEventListener('mousedown', (e) => {
            if(e.button == 0) this.mouseDown = true;
        });

        document.addEventListener('mouseup', (e) => {
            if(e.button == 0) this.mouseDown = false;
        });

        document.addEventListener('mousemove', (e) => {
            if(!this.mouseDown) return;

            this.yaw   += e.movementX;
            this.pitch += e.movementY;

            if (Math.abs(this.pitch) >= 89) {
                this.pitch = 89 * this.pitch / Math.abs(this.pitch);
            }
        });

        document.addEventListener('wheel', (e) => {
            if(camera instanceof OrthographicCamera) {
                camera.zoom -= e.deltaY / 100;
            } else {
                this.distance += e.deltaY / 100;
            }
        });

        if(camera instanceof PerspectiveCamera || camera instanceof OrthographicCamera) {
            const normal = camera.eye;
            this.yaw = Math.atan2(normal.x, normal.z) * 180 / Math.PI;
            this.pitch = Math.asin(normal.y) * 180 / Math.PI;

            console.log(this.pitch);

            camera.target.set(0, 0, 0);

            this.distance = camera.eye.length();;
        }

        this.update();
    }

    update() {
        const yawRadians   = glMatrix.toRadian(this.yaw)
        const pitchRadians = glMatrix.toRadian(this.pitch - 90);

        if(this.camera instanceof PerspectiveCamera) {
            this.camera.eye.x = this.distance * Math.sin(pitchRadians) * Math.cos(yawRadians) + this.target.x;
            this.camera.eye.y = this.distance * Math.cos(pitchRadians) + this.target.y;
            this.camera.eye.z = this.distance * Math.sin(pitchRadians) * Math.sin(yawRadians) + this.target.z;

            this.camera.target.x = -this.camera.eye.x + this.target.x;
            this.camera.target.y = -this.camera.eye.y + this.target.y;
            this.camera.target.z = -this.camera.eye.z + this.target.z;
            this.camera.updateView();
        }

        if(this.camera instanceof OrthographicCamera) {
            this.camera.eye.x = this.distance * Math.sin(pitchRadians) * Math.cos(yawRadians);
            this.camera.eye.y = this.distance * Math.cos(pitchRadians);
            this.camera.eye.z = this.distance * Math.sin(pitchRadians) * Math.sin(yawRadians);
            this.camera.updateView();
            this.camera.updateProjection();
        }
    }
}