import { IVertexBuffer } from "../VertexBuffer";
import { WebGLContext } from "./WebGLContext";

export class WebGLVertexBuffer implements IVertexBuffer {
    public buffer: WebGLBuffer;
    public data: Float32Array;
    public size: number;

    constructor(data: Float32Array, size: number, public dynamic: boolean = false) {
        const gl = WebGLContext.gl;

        const buffer = gl.createBuffer()!;
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
        gl.bufferData(gl.ARRAY_BUFFER, data, dynamic ? gl.DYNAMIC_DRAW : gl.STATIC_DRAW);
        gl.bindBuffer(gl.ARRAY_BUFFER, null);

        this.buffer = buffer;
        this.data = data;
        this.size = size;
    }

    setData(data: Float32Array, len?: number): void {
        // this.size = data.length;

        const gl = WebGLContext.gl;
        gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
        // gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
        gl.bufferSubData(gl.ARRAY_BUFFER, 0, data, 0, len);
        gl.bindBuffer(gl.ARRAY_BUFFER, null);
    }
}