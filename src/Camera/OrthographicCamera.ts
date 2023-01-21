import { mat4 } from "gl-matrix";
import { Vector3 } from "../Math/Vector";
import { Camera } from "./Camera";

export class OrthographicCamera extends Camera {
    public zoom: number;

    public eye: Vector3;
    public target: Vector3;
    public up: Vector3;

    constructor(public left: number, public right: number, public bottom: number, public top: number, public near: number, public far: number) {
        super();

        this.zoom = 1;

        this.eye    = new Vector3();
        this.target = new Vector3();
        this.up     = new Vector3(0, 1, 0);

        this.projectionMatrix = mat4.create();
        this.viewMatrix       = mat4.create();

        mat4.ortho(this.projectionMatrix, left, right, bottom, top, near, far);
        mat4.lookAt(this.viewMatrix, this.eye.buffer, this.target.buffer, this.up.buffer);
        // mat4.invert(this.viewMatrix, this.viewMatrix);
    }

    updateView() {
        mat4.lookAt(this.viewMatrix, this.eye.buffer, this.target.buffer, this.up.buffer);
        // mat4.invert(this.viewMatrix, this.viewMatrix);
    }

    updateProjection() {
        mat4.ortho(this.projectionMatrix, this.left / this.zoom, this.right / this.zoom, this.bottom / this.zoom, this.top / this.zoom, this.near, this.far);
    }
}