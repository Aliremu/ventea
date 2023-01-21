/// <reference types="dist" />
export declare class ComputeBuffer {
    count: number;
    stride: number;
    buffer: GPUBuffer;
    data: ArrayBuffer;
    size: number;
    private stagingBuffer;
    constructor(count: number, stride: number);
    setData(bufferOffset: number, data: BufferSource | SharedArrayBuffer, dataOffset?: number | undefined, size?: number | undefined): void;
    getData(): Promise<ArrayBuffer>;
}
