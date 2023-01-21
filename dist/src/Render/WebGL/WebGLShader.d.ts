import { IShader } from "../Shader";
import { WebGLUniformBuffer } from "./WebGLUniformBuffer";
export declare class WebGLShader implements IShader {
    vertSrc: string;
    fragSrc: string;
    vertex: Map<string, any>;
    uniforms: Map<string, any>;
    buffers: Map<string, WebGLUniformBuffer>;
    program: WebGLProgram;
    constructor(vertSrc: string, fragSrc: string);
    setUniforms(uniforms?: any): void;
    compileShader(source: string, type: number): globalThis.WebGLShader;
}
