import { Vector3 } from "./Vector";
export declare class Quat {
    buffer: Float32Array;
    constructor(...values: number[]);
    getEuler(): Vector3;
    set(x: number, y: number, z: number, w: number): void;
    get x(): number;
    set x(value: number);
    get y(): number;
    set y(value: number);
    get z(): number;
    set z(value: number);
    get w(): number;
    set w(value: number);
}
