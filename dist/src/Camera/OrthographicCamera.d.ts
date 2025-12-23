import { mat4 } from "gl-matrix";
import { Vector3 } from "../Math/Vector";
import { ICamera } from "./ICamera";
export declare class OrthographicCamera implements ICamera {
    left: number;
    right: number;
    bottom: number;
    top: number;
    near: number;
    far: number;
    zoom: number;
    position: Vector3;
    target: Vector3;
    up: Vector3;
    projectionMatrix: mat4;
    viewMatrix: mat4;
    isOrthographic: boolean;
    constructor(left: number, right: number, bottom: number, top: number, near: number, far: number);
    updateView(): void;
    updateProjection(): void;
}
