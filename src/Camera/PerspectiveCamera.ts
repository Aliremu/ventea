import { glMatrix, mat4, quat, vec3 } from "gl-matrix";
import { Quat } from "../Math/Quat";
import { Utils } from "../Math/Utils";
import { Vector3 } from "../Math/Vector";
import { Vector3Proxy } from "../Scene/Components";
import { ICamera } from "./ICamera";

export class PerspectiveCamera implements ICamera {
    public orientation: Quat;
    public yaw: number;
    public pitch: number;

    public target: Vector3;
    public up: Vector3;
    public right: Vector3;
    public direction: Vector3;

    public position: Vector3;
    public projectionMatrix: mat4;
    public viewMatrix: mat4;
    public isOrthographic: boolean;

    constructor(public fov: number, public aspect: number, public zNear: number, public zFar: number) {
        this.target = new Vector3(0, 0, 1);

        this.up     = new Vector3(0, 1, 0);
        this.right  = new Vector3(1, 0, 0);
        
        this.direction = new Vector3(0, 0, 1);
        this.orientation = new Quat(0, 0, 0, 1);
        this.yaw = 0;
        this.pitch = 0;

        this.position         = new Vector3(0, 0, 0);
        this.projectionMatrix = mat4.create();
        this.viewMatrix       = mat4.create();
        this.isOrthographic = false;

        mat4.perspective(this.projectionMatrix, glMatrix.toRadian(fov), aspect, zNear, zFar);
        mat4.lookAt(this.viewMatrix, this.position.buffer, this.target.buffer, this.up.buffer);
        // mat4.invert(this.viewMatrix, this.viewMatrix);
    }

    updateView() {
        /*const dir = this.target.clone().sub(this.eye);
        this.yaw = Math.atan2(dir.x, dir.z);
        this.pitch = Math.asin(dir.y);*/

        if(Math.abs(this.pitch) >= Math.PI / 2) {
            this.pitch = Math.sign(this.pitch) * Math.PI / 2;
        }

        // let r = Math.cos(this.pitch);
    
        // this.direction.x = r * Math.cos(this.yaw);
        // this.direction.y = Math.sin(this.pitch);
        // this.direction.z = r * Math.sin(this.yaw);

        const aroundY = quat.create();
        const aroundX = quat.create();
        quat.setAxisAngle(aroundY, this.up.buffer, -this.yaw);
        quat.setAxisAngle(aroundX, this.right.buffer, this.pitch);

        quat.mul(this.orientation.buffer, aroundY, aroundX);
        mat4.fromRotationTranslation(this.viewMatrix, this.orientation.buffer, this.position.buffer);
        mat4.invert(this.viewMatrix, this.viewMatrix);
        // mat4.lookAt(this.viewMatrix, this.eye.buffer, this.target.buffer, this.up.buffer);
        // mat4.invert(this.viewMatrix, this.viewMatrix);
    }

    updateProjection() {
        mat4.perspective(this.projectionMatrix, glMatrix.toRadian(this.fov), this.aspect, this.zNear, this.zFar);
    }

    lookAt(x: number, y: number, z: number) {
        const dir = new Vector3(x, y, z).sub(this.position);

        this.yaw = Math.atan2(dir.x, -dir.z);
        this.pitch = Math.asin(dir.y);

        this.updateView();
    }
}