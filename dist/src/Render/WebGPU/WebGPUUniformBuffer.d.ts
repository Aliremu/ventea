/// <reference types="dist" />
import { IUniformBuffer } from "../UniformBuffer";
export declare class WebGPUUniformBuffer implements IUniformBuffer {
    buffer: GPUBuffer;
    data: Float32Array | Uint16Array;
    size: number;
    constructor(size: number);
    setData(bufferOffset: number, data: BufferSource | SharedArrayBuffer, dataOffset?: number | undefined, size?: number | undefined): void;
}
