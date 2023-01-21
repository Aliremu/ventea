import { Vector3 } from "../Math/Vector";
import { Camera } from "./Camera";
export declare class OrthographicCamera extends Camera {
    left: number;
    right: number;
    bottom: number;
    top: number;
    near: number;
    far: number;
    zoom: number;
    eye: Vector3;
    target: Vector3;
    up: Vector3;
    constructor(left: number, right: number, bottom: number, top: number, near: number, far: number);
    updateView(): void;
    updateProjection(): void;
}
