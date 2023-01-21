import { IIndexBuffer, IndexBuffer } from "../IndexBuffer";
import { WebGLContext } from "./WebGLContext";

export class WebGLIndexBuffer implements IIndexBuffer {
    public buffer: WebGLBuffer;
    public data: Uint32Array;
    public size: number;

    constructor(data: Uint32Array, size: number) {
        const gl = WebGLContext.gl;

        const buffer = gl.createBuffer()!;
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, data, gl.STATIC_DRAW);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);

        this.buffer = buffer;
        this.data = data;
        this.size = size;
    }

    setData(data: Uint32Array): void {
        this.size = data.length;
        
        const gl = WebGLContext.gl;
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.buffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, data, gl.STATIC_DRAW);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
    }
}