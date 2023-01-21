import { IUniformBuffer } from "../UniformBuffer";
export declare class WebGLUniformBuffer implements IUniformBuffer {
    size: number;
    buffer: WebGLBuffer;
    data: Float32Array | Uint16Array;
    constructor(size: number);
    setData(bufferOffset: number, data: ArrayBufferView, dataOffset?: number, size?: number | undefined): void;
}
