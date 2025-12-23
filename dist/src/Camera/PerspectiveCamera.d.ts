import { mat4 } from "gl-matrix";
import { Quat } from "../Math/Quat";
import { Vector3 } from "../Math/Vector";
import { ICamera } from "./ICamera";
export declare class PerspectiveCamera implements ICamera {
    fov: number;
    aspect: number;
    zNear: number;
    zFar: number;
    orientation: Quat;
    yaw: number;
    pitch: number;
    target: Vector3;
    up: Vector3;
    right: Vector3;
    direction: Vector3;
    position: Vector3;
    projectionMatrix: mat4;
    viewMatrix: mat4;
    isOrthographic: boolean;
    constructor(fov: number, aspect: number, zNear: number, zFar: number);
    updateView(): void;
    updateProjection(): void;
    lookAt(x: number, y: number, z: number): void;
}
