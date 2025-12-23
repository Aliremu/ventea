import { IShader } from "../Shader";
import { WebGPUContext } from "./WebGPUContext";
import { WebGPURendererAPI } from "./WebGPURendererAPI";
import { WebGPUStorageBuffer } from "./WebGPUStorageBuffer";
import { WebGPUUniformBuffer } from "./WebGPUUniformBuffer";
import { WgslReflect } from "./wgsl_reflect.module.js";

const TYPE_MAP: Map<string, GPUVertexFormat> = new Map<string, GPUVertexFormat>([
    ['f32', 'float32'],
    ['vec2f32', 'float32x2'],
    ['vec3f32', 'float32x3'],
    ['vec4f32', 'float32x4']
]);

export class WebGPUShader implements IShader {
    public vertModule: GPUShaderModule;
    public fragModule: GPUShaderModule;

    public uniformBuffers: WebGPUUniformBuffer[] | WebGPUStorageBuffer[];
    public customBuffer: WebGPUUniformBuffer;

    public uniformBindGroup: GPUBindGroup = null!;
    public transformBindGroup: GPUBindGroup = null!;
    public customBindGroup: GPUBindGroup = null!;

    public uniformBindGroupLayout: GPUBindGroupLayout = null!;
    public transformBindGroupLayout: GPUBindGroupLayout = null!;
    public customBindGroupLayout: GPUBindGroupLayout = null!;

    public vertexAttributes: Map<string, GPUVertexBufferLayout>;
    public bindGroups: Map<string, any>[];

    constructor(public vertSrc: string, public fragSrc: string) {
        this.bindGroups = [];

        this.vertModule = WebGPUContext.device.createShaderModule({ code: vertSrc });
        this.fragModule = WebGPUContext.device.createShaderModule({ code: fragSrc });

        this.uniformBuffers = [];
        this.uniformBuffers[0] = new WebGPUUniformBuffer(32);
        this.uniformBuffers[1] = WebGPURendererAPI.transformBuffer;
        this.uniformBuffers[2] = WebGPURendererAPI.lightsBuffer;

        this.vertexAttributes = new Map();
        const reflect = new WgslReflect(vertSrc + fragSrc);

        for(const input of (reflect.entry.vertex[0] as any).inputs) {
            if(input.locationType === 'builtin') continue;

            const type = input.type.name + input.type.format.name;
            let count = 1;

            if(input.type.name === 'vec2') count = 2;
            if(input.type.name === 'vec3') count = 3;
            if(input.type.name === 'vec4') count = 4;

            const layout: GPUVertexBufferLayout = {
                attributes: [{ format: TYPE_MAP.get(type)!, shaderLocation: input.location, offset: 0 }],
                arrayStride: count * 4,
                stepMode: 'vertex'
            };

            this.vertexAttributes.set(input.name, layout);
        }

        const groups = reflect.getBindGroups();

        // console.log(groups);

        for(const group in groups) {
            this.bindGroups[group] = new Map();

            const bindings = groups[group];
            for(const binding of bindings) {
                const resource = binding.resource as any;
                const name = resource.name;
                this.bindGroups[group].set(name, resource);
            }
        }

        let customBufferSize = (groups[2][0].resource as any).size;
        this.customBuffer = new WebGPUUniformBuffer(customBufferSize);
        this.uniformBuffers[3] = this.customBuffer;

        this.uniformBindGroupLayout = WebGPUContext.device.createBindGroupLayout({
            entries: [
                {
                    binding: 0,
                    visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT,
                    buffer: {}
                }
            ]
        });

        this.transformBindGroupLayout = WebGPUContext.device.createBindGroupLayout({
            entries: [
                {
                    binding: 0,
                    visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT,
                    buffer: {}
                },
                {
                    binding: 1,
                    visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT,
                    buffer: {}
                }
            ]
        });

        this.customBindGroupLayout = WebGPUContext.device.createBindGroupLayout({
            entries: [
                {
                    binding: 0,
                    visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT,
                    buffer: {}
                }
            ]
        });

        this.setupBindGroups();
    }

    setInt(name: string, val: number): void {
        throw new Error("Method not implemented.");
    }
    setFloat(name: string, val: number): void {
        throw new Error("Method not implemented.");
    }
    setVec2(name: string, val: Float32List): void {
        throw new Error("Method not implemented.");
    }
    setVec3(name: string, val: Float32List): void {
        throw new Error("Method not implemented.");
    }
    setVec4(name: string, val: Float32List): void {
        throw new Error("Method not implemented.");
    }
    setMat3(name: string, val: Float32List): void {
        throw new Error("Method not implemented.");
    }
    setMat4(name: string, val: Float32List): void {
        throw new Error("Method not implemented.");
    }

    writeUniformBuffer(binding: number, bufferOffset: number, data: BufferSource | SharedArrayBuffer, dataOffset: number, size: number) {
        WebGPUContext.queue.writeBuffer(this.uniformBuffers[binding].buffer, bufferOffset, data, dataOffset, size);
    }

    setupBindGroups() {
        this.uniformBindGroup = WebGPUContext.device.createBindGroup({
            layout: this.uniformBindGroupLayout,
            entries: [
                {
                    binding: 0,
                    resource: {
                        buffer: this.uniformBuffers[0].buffer
                    }
                }
            ]
        });

        this.transformBindGroup = WebGPUContext.device.createBindGroup({
            layout: this.transformBindGroupLayout,
            entries: [
                {
                    binding: 0,
                    resource: {
                        buffer: WebGPURendererAPI.transformBuffer.buffer
                    }
                },
                {
                    binding: 1,
                    resource: {
                        buffer: WebGPURendererAPI.lightsBuffer.buffer
                    }
                }
            ]
        });

        this.customBindGroup = WebGPUContext.device.createBindGroup({
            layout: this.customBindGroupLayout,
            entries: [
                {
                    binding: 0,
                    resource: {
                        buffer: this.customBuffer.buffer
                    }
                }
            ]
        });
    }
}