/// <reference types="dist" />
import { IShader } from "../Shader";
import { WebGPUStorageBuffer } from "./WebGPUStorageBuffer";
import { WebGPUUniformBuffer } from "./WebGPUUniformBuffer";
export declare class WebGPUShader implements IShader {
    vertSrc: string;
    fragSrc: string;
    vertModule: GPUShaderModule;
    fragModule: GPUShaderModule;
    uniformBuffers: WebGPUUniformBuffer[] | WebGPUStorageBuffer[];
    customBuffer: WebGPUUniformBuffer;
    uniformBindGroup: GPUBindGroup;
    transformBindGroup: GPUBindGroup;
    customBindGroup: GPUBindGroup;
    uniformBindGroupLayout: GPUBindGroupLayout;
    transformBindGroupLayout: GPUBindGroupLayout;
    customBindGroupLayout: GPUBindGroupLayout;
    vertexAttributes: Map<string, GPUVertexBufferLayout>;
    bindGroups: Map<string, any>[];
    constructor(vertSrc: string, fragSrc: string);
    setInt(name: string, val: number): void;
    setFloat(name: string, val: number): void;
    setVec2(name: string, val: Float32List): void;
    setVec3(name: string, val: Float32List): void;
    setVec4(name: string, val: Float32List): void;
    setMat3(name: string, val: Float32List): void;
    setMat4(name: string, val: Float32List): void;
    writeUniformBuffer(binding: number, bufferOffset: number, data: BufferSource | SharedArrayBuffer, dataOffset: number, size: number): void;
    setupBindGroups(): void;
}
