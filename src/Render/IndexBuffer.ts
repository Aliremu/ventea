import { API, Renderer } from "./Renderer";
import { WebGLIndexBuffer } from "./WebGL/WebGLIndexBuffer";
import { WebGPUIndexBuffer } from "./WebGPU/WebGPUIndexBuffer";

export interface IIndexBuffer {
    data: Uint32Array;
    size: number;

    setData(data: Uint32Array): void
}   

export class IndexBuffer {
    public _impl: IIndexBuffer;

    constructor(data: Uint32Array, size: number) {
        switch(Renderer.api) {
            case API.WebGL: 
                this._impl = new WebGLIndexBuffer(data, size);  
                break;
            case API.WebGPU: 
                this._impl = new WebGPUIndexBuffer(data, size);  
                break;
        }
    }

    get data(): Uint32Array {
        return this._impl.data;
    }

    get size(): number {
        return this._impl.size;
    }

    setData(data: Uint32Array): void {
        this._impl.setData(data);
    }

    as<T>(): T {
        return this._impl as unknown as T;
    }
}