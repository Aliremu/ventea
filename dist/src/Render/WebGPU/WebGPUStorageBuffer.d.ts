/// <reference types="dist" />
export declare class WebGPUStorageBuffer {
    buffer: GPUBuffer;
    data: Float32Array | Uint16Array;
    size: number;
    constructor(size: number);
    setData(bufferOffset: number, data: BufferSource | SharedArrayBuffer, dataOffset?: number | undefined, size?: number | undefined): void;
}
