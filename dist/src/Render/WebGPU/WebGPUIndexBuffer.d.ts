/// <reference types="dist" />
import { IIndexBuffer } from "../IndexBuffer";
export declare class WebGPUIndexBuffer implements IIndexBuffer {
    buffer: GPUBuffer;
    data: Uint32Array;
    size: number;
    constructor(data: Uint32Array, size: number);
    setData(data: Uint32Array): void;
}
