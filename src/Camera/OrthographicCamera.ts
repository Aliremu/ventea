import { mat4 } from "gl-matrix";
import { Vector3 } from "../Math/Vector";
import { ICamera } from "./ICamera";

export class OrthographicCamera implements ICamera {
    public zoom: number;

    public position: Vector3;

    public target: Vector3;
    public up: Vector3;

    public projectionMatrix: mat4;
    public viewMatrix: mat4;
    public isOrthographic: boolean;

    constructor(public left: number, public right: number, public bottom: number, public top: number, public near: number, public far: number) {
        this.zoom = 1;

        this.target = new Vector3(0, 0, -1);
        this.up     = new Vector3(0, 1,  0);

        this.position         = new Vector3(0, 0,  0);
        this.projectionMatrix = mat4.create();
        this.viewMatrix       = mat4.create();
        this.isOrthographic = true;

        mat4.ortho(this.projectionMatrix, left, right, bottom, top, near, far);
        mat4.lookAt(this.viewMatrix, this.position.buffer, this.target.buffer, this.up.buffer);
    }
    

    updateView() {
        mat4.lookAt(this.viewMatrix, this.position.buffer, this.target.buffer, this.up.buffer);
    }

    updateProjection() {
        mat4.ortho(this.projectionMatrix, this.left / this.zoom, this.right / this.zoom, this.bottom / this.zoom, this.top / this.zoom, this.near, this.far);
    }
}