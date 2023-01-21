import { mat4 } from "gl-matrix";

export abstract class Camera {
    projectionMatrix!: mat4;
    viewMatrix!: mat4;
}