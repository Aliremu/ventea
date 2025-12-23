import { mat4 } from "gl-matrix";
export interface ICamera {
    projectionMatrix: mat4;
    viewMatrix: mat4;
}
