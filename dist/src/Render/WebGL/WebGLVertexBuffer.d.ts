import { IVertexBuffer } from "../VertexBuffer";
export declare class WebGLVertexBuffer implements IVertexBuffer {
    dynamic: boolean;
    buffer: WebGLBuffer;
    data: Float32Array;
    size: number;
    constructor(data: Float32Array, size: number, dynamic?: boolean);
    setData(data: Float32Array, len?: number): void;
}
