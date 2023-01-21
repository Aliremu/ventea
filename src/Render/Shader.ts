import { API, Renderer } from "./Renderer";
import { WebGLShader } from "./WebGL/WebGLShader";
import { WebGPUShader } from "./WebGPU/WebGPUShader";

export interface IShader {
    vertSrc: string;
    fragSrc: string;

    vertex: Map<string, any>;
}

export class Shader {
    public _impl: IShader;

    constructor(vertSrc: string, fragSrc: string) {
        switch(Renderer.api) {
            case API.WebGL:
                this._impl = new WebGLShader(vertSrc, fragSrc);
                break;
            case API.WebGPU:
                this._impl = new WebGPUShader(vertSrc, fragSrc);
                break;
        }
    }

    as<T>(): T {
        return this._impl as unknown as T;
    }
}