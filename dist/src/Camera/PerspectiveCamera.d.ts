import { Vector3 } from "../Math/Vector";
import { Camera } from "./Camera";
export declare class PerspectiveCamera extends Camera {
    fov: number;
    aspect: number;
    zNear: number;
    zFar: number;
    eye: Vector3;
    target: Vector3;
    up: Vector3;
    constructor(fov: number, aspect: number, zNear: number, zFar: number);
    updateView(): void;
    updateProjection(): void;
}
