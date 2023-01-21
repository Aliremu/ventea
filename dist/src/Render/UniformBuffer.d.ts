/// <reference types="dist" />
export interface IUniformBuffer {
    data: Float32Array | Uint16Array;
    buffer: GPUBuffer | WebGLBuffer;
    size: number;
    setData(bufferOffset: GPUSize64, data: BufferSource | SharedArrayBuffer, dataOffset?: GPUSize64, size?: GPUSize64): void;
}
export declare class UniformBuffer {
    _impl: IUniformBuffer;
    constructor(size: number);
    get data(): Float32Array | Uint16Array;
    get size(): number;
    get buffer(): GPUBuffer | WebGLBuffer;
    as<T>(): T;
    setData(bufferOffset: GPUSize64, data: BufferSource | SharedArrayBuffer, dataOffset?: GPUSize64, size?: GPUSize64): void;
}
