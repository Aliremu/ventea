import { API, Renderer } from "./Renderer";
import { WebGLVertexBuffer } from "./WebGL/WebGLVertexBuffer";
import { WebGPUVertexBuffer } from "./WebGPU/WebGPUVertexBuffer";

export interface IVertexBuffer {
    data: Float32Array;
    size: number;

    setData(data: Float32Array): void;
}


export class VertexBuffer {
    public _impl: IVertexBuffer;
    constructor(data: Float32Array, size: number) {
        switch(Renderer.api) {
            case API.WebGL: 
                this._impl = new WebGLVertexBuffer(data, size);
                break;
            case API.WebGPU: 
                this._impl = new WebGPUVertexBuffer(data, size);  
                break;
        }
    }

    get data(): Float32Array {
        return this._impl.data;
    }

    get size(): number {
        return this._impl.size;
    }

    setData(data: Float32Array): void {
        this._impl.setData(data);
    }

    as<T>(): T {
        return this._impl as unknown as T;
    }
}