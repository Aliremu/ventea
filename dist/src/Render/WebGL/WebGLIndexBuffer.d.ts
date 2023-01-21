import { IIndexBuffer } from "../IndexBuffer";
export declare class WebGLIndexBuffer implements IIndexBuffer {
    buffer: WebGLBuffer;
    data: Uint32Array;
    size: number;
    constructor(data: Uint32Array, size: number);
    setData(data: Uint32Array): void;
}
