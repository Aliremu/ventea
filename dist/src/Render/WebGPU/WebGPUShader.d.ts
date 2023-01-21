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
    uniformBindGroup: GPUBindGroup;
    transformBindGroup: GPUBindGroup;
    vertex: Map<string, GPUVertexBufferLayout>;
    bindGroups: Map<string, number>[];
    constructor(vertSrc: string, fragSrc: string);
    writeUniformBuffer(binding: number, bufferOffset: number, data: BufferSource | SharedArrayBuffer, dataOffset: number, size: number): void;
    createBindGroup(pipeline: GPURenderPipeline): void;
}
