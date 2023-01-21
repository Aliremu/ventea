import { IVertexBuffer } from "../VertexBuffer";
export declare class WebGLVertexBuffer implements IVertexBuffer {
    buffer: WebGLBuffer;
    data: Float32Array;
    size: number;
    constructor(data: Float32Array, size: number);
    setData(data: Float32Array): void;
}
