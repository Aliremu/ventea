import { IShader } from "../Shader";
import { WebGLUniformBuffer } from "./WebGLUniformBuffer";
export declare class WebGLShader implements IShader {
    vertSrc: string;
    fragSrc: string;
    vertexAttributes: Map<string, any>;
    uniforms: Map<string, any>;
    buffers: Map<string, WebGLUniformBuffer>;
    program: WebGLProgram;
    constructor(vertSrc: string, fragSrc: string);
    setInt(name: string, val: number): void;
    setFloat(name: string, val: number): void;
    setVec2(name: string, val: Float32List): void;
    setVec3(name: string, val: Float32List): void;
    setVec4(name: string, val: Float32List): void;
    setMat3(name: string, val: Float32List): void;
    setMat4(name: string, val: Float32List): void;
    setUniforms(uniforms?: any): void;
    setUniform<T>(name: string, val: number | number[] | Float32Array): void;
    compileShader(source: string, type: number): globalThis.WebGLShader;
}
