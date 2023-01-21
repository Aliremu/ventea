import { Vector3Proxy } from "../Scene/Components";
export declare class Vector2 {
    buffer: Float32Array;
    constructor(...values: number[]);
    clone(): Vector3;
    length(): number;
    normalize(): this;
    get normalized(): Vector2;
    add(other: Vector2 | number, y?: number): this;
    sub(other: Vector2 | number, y?: number): this;
    mul(other: Vector2 | number, y?: number): this;
    div(other: Vector2 | number, y?: number): this;
    reset(): void;
    set(x: number, y: number): void;
    get x(): number;
    set x(value: number);
    get y(): number;
    set y(value: number);
}
export declare class Vector3 {
    buffer: Float32Array;
    constructor(...values: number[]);
    clone(): Vector3;
    length(): number;
    normalize(): this;
    get normalized(): Vector3;
    add(other: Vector3 | Vector3Proxy | Vector2 | number): this;
    sub(other: Vector3 | Vector3Proxy | Vector2 | number): this;
    mul(other: Vector3 | Vector3Proxy | Vector2 | number): this;
    div(other: Vector3 | Vector3Proxy | Vector2 | number): this;
    reset(): void;
    set(x: number, y: number, z: number): void;
    get x(): number;
    set x(value: number);
    get y(): number;
    set y(value: number);
    get z(): number;
    set z(value: number);
}
export declare class Vector4 {
    buffer: Float32Array;
    constructor(...values: number[]);
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
