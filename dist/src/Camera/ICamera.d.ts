import { mat4 } from "gl-matrix";
import { Vector3 } from "../Math/Vector";
export interface ICamera {
    projectionMatrix: mat4;
    viewMatrix: mat4;
    position: Vector3;
    isOrthographic: boolean;
}
