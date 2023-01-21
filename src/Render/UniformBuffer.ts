import { API, Renderer } from "./Renderer";
import { WebGLUniformBuffer } from "./WebGL/WebGLUniformBuffer";
import { WebGPUUniformBuffer } from "./WebGPU/WebGPUUniformBuffer";

export interface IUniformBuffer {
    data: Float32Array | Uint16Array;
    buffer: GPUBuffer | WebGLBuffer;
    size: number;

    setData(bufferOffset: GPUSize64, data: | BufferSource | SharedArrayBuffer, dataOffset?: GPUSize64, size?: GPUSize64): void;
}


export class UniformBuffer {
    public _impl: IUniformBuffer;
    
    constructor(size: number) {
        switch(Renderer.api) {
            case API.WebGL: 
                this._impl = new WebGLUniformBuffer(size); 
                break;
            case API.WebGPU: 
                this._impl = new WebGPUUniformBuffer(size); 
                break;
        }
    }

    get data(): Float32Array | Uint16Array {
        return this._impl.data;
    }

    get size(): number {
        return this._impl.size;
    }

    get buffer(): GPUBuffer | WebGLBuffer {
        return this._impl.buffer;
    }

    as<T>(): T {
        return this._impl as unknown as T;
    }

    setData(bufferOffset: GPUSize64, data: | BufferSource | SharedArrayBuffer, dataOffset?: GPUSize64, size?: GPUSize64): void {
        this._impl.setData(bufferOffset, data, dataOffset, size);
    }
}