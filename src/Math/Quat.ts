import { mat4 } from "gl-matrix";
import { Utils } from "./Utils";
import { Vector3 } from "./Vector";

export class Quat {
    public buffer: Float32Array;

    constructor(...values: number[]) {
        switch (values.length) {
            case 4: this.buffer = new Float32Array(values); break;
            case 3: this.buffer = new Float32Array([values[0], values[1], values[2], 0]); break;
            case 2: this.buffer = new Float32Array([values[0], values[1], 0, 0]); break;
            case 1: this.buffer = new Float32Array([values[0], values[0], values[0]]); break;
            default: this.buffer = new Float32Array(3); break;
        }
    }

    getEuler(): Vector3 {
        const vec = new Vector3();
        const mat = mat4.fromQuat(mat4.create(), this.buffer);

        const m11 = mat[0], m12 = mat[4], m13 = mat[8];
        const m21 = mat[1], m22 = mat[5], m23 = mat[9];
        const m31 = mat[2], m32 = mat[6], m33 = mat[10];

        // vec.x = Math.asin(Utils.clamp(m32, -1, 1));

        // if (Math.abs(m32) < 0.9999999) {
        //     vec.y = Math.atan2(- m31, m33);
        //     vec.z = Math.atan2(- m12, m22);
        // } else {
        //     vec.y = 0;
        //     vec.z = Math.atan2(m21, m11);
        // }

        vec.x = Math.asin(-Utils.clamp(m23, - 1, 1));

        if (Math.abs(m23) < 0.9999999) {
            vec.y = Math.atan2(m13, m33);
            vec.z = Math.atan2(m21, m22);
        } else {
            vec.y = Math.atan2(- m31, m11);
            vec.z = 0;
        }

        return vec;
    }

    set(x: number, y: number, z: number, w: number) {
        this.buffer[0] = x;
        this.buffer[1] = y;
        this.buffer[2] = z;
        this.buffer[3] = w;
    }

    get x() { return this.buffer[0]; }
    set x(value) { this.buffer[0] = value; }

    get y() { return this.buffer[1]; }
    set y(value) { this.buffer[1] = value; }

    get z() { return this.buffer[2]; }
    set z(value) { this.buffer[2] = value; }

    get w() { return this.buffer[3]; }
    set w(value) { this.buffer[3] = value; }
}