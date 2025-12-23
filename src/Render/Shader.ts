import { API, Renderer } from "./Renderer";
import { WebGLShader } from "./WebGL/WebGLShader";
import { WebGPUShader } from "./WebGPU/WebGPUShader";

export interface IShader {
    vertSrc: string;
    fragSrc: string;

    vertexAttributes: Map<string, any>;

    setInt(name: string, val: number): void;
    setFloat(name: string, val: number): void;
    setVec2(name: string, val: Float32List): void;
    setVec3(name: string, val: Float32List): void;
    setVec4(name: string, val: Float32List): void;
    setMat3(name: string, val: Float32List): void;
    setMat4(name: string, val: Float32List): void;
}

const REGISTRY: Map<string, Shader> = new Map<string, Shader>();

export class Shader {
    public _impl: IShader;

    constructor(name: string, vertSrc: string, fragSrc: string) {
        switch(Renderer.api) {
            case API.WebGL:
                this._impl = new WebGLShader(vertSrc, fragSrc);
                break;
            case API.WebGPU:
                this._impl = new WebGPUShader(vertSrc, fragSrc);
                break;
        }

        REGISTRY.set(name, this);
    }

    static find(name: string): Shader {
        const shader = REGISTRY.get(name);

        if(!shader) throw new Error(`Shader not found: ${name}`);

        return shader;
    }

    static get REGISTRY() {
        return REGISTRY;
    }

    as<T>(): T {
        return this._impl as unknown as T;
    }
}