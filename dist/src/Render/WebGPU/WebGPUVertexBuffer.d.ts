/// <reference types="dist" />
import { IVertexBuffer } from "../VertexBuffer";
export declare class WebGPUVertexBuffer implements IVertexBuffer {
    buffer: GPUBuffer;
    data: Float32Array;
    size: number;
    constructor(data: Float32Array, size: number);
    setData(data: Float32Array): void;
}
