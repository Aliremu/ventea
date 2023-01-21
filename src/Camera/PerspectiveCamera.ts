import { glMatrix, mat4, vec3 } from "gl-matrix";
import { Vector3 } from "../Math/Vector";
import { Camera } from "./Camera";

export class PerspectiveCamera extends Camera {
    public eye: Vector3;
    public target: Vector3;
    public up: Vector3;

    constructor(public fov: number, public aspect: number, public zNear: number, public zFar: number) {
        super();

        this.eye    = new Vector3();
        this.target = new Vector3(0, 0, 1);
        this.up     = new Vector3(0, 1, 0);

        this.projectionMatrix = mat4.create();
        this.viewMatrix       = mat4.create();

        mat4.perspective(this.projectionMatrix, glMatrix.toRadian(fov), aspect, zNear, zFar);
        mat4.lookAt(this.viewMatrix, this.eye.buffer, this.target.buffer, this.up.buffer);
        // mat4.invert(this.viewMatrix, this.viewMatrix);
    }

    updateView() {
        mat4.lookAt(this.viewMatrix, this.eye.buffer, this.target.buffer, this.up.buffer);
        // mat4.invert(this.viewMatrix, this.viewMatrix);
    }

    updateProjection() {
        mat4.perspective(this.projectionMatrix, glMatrix.toRadian(this.fov), this.aspect, this.zNear, this.zFar);
    }
}