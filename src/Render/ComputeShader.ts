import { TypedArray } from "bitecs";
import { ComputeBuffer } from "./ComputeBuffer";
import { WebGPUContext } from "./WebGPU/WebGPUContext";
import { WebGPUStorageBuffer } from "./WebGPU/WebGPUStorageBuffer";
import { UniformBufferInfo, WgslReflect } from "./WebGPU/wgsl_reflect.module";

export class ComputeShader {
    private module: GPUShaderModule;
    private pipeline: GPUComputePipeline;
    private descriptor: Map<string, number>;
    private bindGroup?: GPUBindGroup;
    private entires: GPUBindGroupEntry[];

    constructor(src: string) {
        const device = WebGPUContext.device;
        this.module = device.createShaderModule({ code: src });
        this.pipeline = device.createComputePipeline({
            compute: {
                module: this.module,
                entryPoint: 'main'
            },
            layout: 'auto'
        });

        console.log(device.limits);

        const reflect = new WgslReflect(src);

        const groups = reflect.getBindGroups();
        console.log(groups);

        this.descriptor = new Map();
        this.entires = [];

        const bindings = groups[0];
        for (const binding of bindings) {
            const resource = binding.resource as any;
            const name = resource.name;
            this.descriptor.set(name, resource.binding);
        }
    }

    setBuffer(name: string, buffer: ComputeBuffer) {
        const device = WebGPUContext.device;

        if (!this.descriptor.has(name)) return;

        const binding = this.descriptor.get(name)!;

        this.entires.push({
            binding: binding,
            resource: {
                buffer: buffer.buffer,  
            }
        });
    }

    dispatch(x: number, y?: number, z?: number) {
        if(!this.bindGroup) {
            this.bindGroup = WebGPUContext.device.createBindGroup({
                layout: this.pipeline.getBindGroupLayout(0),
                entries: this.entires
            });
        }

        const commandEncoder = WebGPUContext.device.createCommandEncoder();
        const passEncoder = commandEncoder.beginComputePass();
        passEncoder.setPipeline(this.pipeline);
        passEncoder.setBindGroup(0, this.bindGroup);
        passEncoder.dispatchWorkgroups(x, y, z);
        passEncoder.end();
        const commands = commandEncoder.finish();
        WebGPUContext.queue.submit([commands]);
    }
}