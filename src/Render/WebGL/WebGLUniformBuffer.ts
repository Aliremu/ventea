import { IUniformBuffer } from "../UniformBuffer";
import { WebGLContext } from "./WebGLContext";

export class WebGLUniformBuffer implements IUniformBuffer {
    public buffer: WebGLBuffer;
    public data: Float32Array | Uint16Array;

    constructor(public size: number) {
        this.data = new Float32Array(size);

        const gl = WebGLContext.gl;

        const buffer = gl.createBuffer()!;
        gl.bindBuffer(gl.UNIFORM_BUFFER, buffer);
        gl.bufferData(gl.UNIFORM_BUFFER, size, gl.DYNAMIC_DRAW);
        gl.bindBuffer(gl.UNIFORM_BUFFER, null);
        gl.bindBufferBase(gl.UNIFORM_BUFFER, 0, buffer);
        // gl.uniformBlockBinding(_program, _matrixBlockLocation, _matrixBufferBindingPoint);

        this.buffer = buffer;
    }

    setData(bufferOffset: number, data: ArrayBufferView, dataOffset: number = 0, size?: number | undefined): void {
        const gl = WebGLContext.gl;

        if(size) size *= 1;

        gl.bindBuffer(gl.UNIFORM_BUFFER, this.buffer);
        gl.bufferSubData(gl.UNIFORM_BUFFER, bufferOffset, data, dataOffset, size);
        gl.bindBuffer(gl.UNIFORM_BUFFER, null);
        gl.bindBufferBase(gl.UNIFORM_BUFFER, 0, this.buffer);
    }
}