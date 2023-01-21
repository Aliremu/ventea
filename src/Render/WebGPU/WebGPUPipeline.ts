import { IPipeline, PipelineLayout, ShaderType } from "../Pipeline";
import { WebGPUContext } from "./WebGPUContext";
import { WebGPUShader } from "./WebGPUShader";
import { WebGPUVertexBuffer } from "./WebGPUVertexBuffer";

export class WebGPUPipieline implements IPipeline {
    public pipeline: GPURenderPipeline;
    public shader: WebGPUShader;

    constructor(public layout: PipelineLayout) { //, topology: GPUPrimitiveTopology = 'triangle-list') {
        // const shader = new WebGPUShader('', '');
        this.shader = layout.shader.as<WebGPUShader>();
        let attributesLayout: Array<GPUVertexBufferLayout | null> = new Array();

        /*
        const layout: Iterable<GPUVertexBufferLayout | null> = [
            {
                attributes: [{ format: 'float32x3', shaderLocation: 0, offset: 0 }], //position
                arrayStride: 12,
                stepMode: 'vertex'
            },
            {
                attributes: [{ format: 'float32x3', shaderLocation: 1, offset: 0 }], //normal
                arrayStride: 12,
                stepMode: 'vertex'
            },
            {
                attributes: [{ format: 'float32x2', shaderLocation: 2, offset: 0 }], //texcoord
                arrayStride: 8,
                stepMode: 'vertex'
            }
        ];
        */

        for (const attrib of layout.layout) {
            attributesLayout.push(this.shader.vertex.get(attrib.name)!);
        }

        const topology: GPUPrimitiveTopology = layout.wireframe ? 'line-list' : 'triangle-list';

        const depthStencil: GPUDepthStencilState = {
            depthWriteEnabled: layout.depthTest,
            depthCompare: 'less',
            format: 'depth24plus-stencil8'
        };

        const vertex: GPUVertexState = {
            module: this.shader.vertModule,
            entryPoint: 'main',
            buffers: attributesLayout
        };

        const colorState: GPUColorTargetState = {
            format: 'bgra8unorm',
            blend: {
                alpha: {
                    srcFactor: 'one',
                    dstFactor: 'zero',
                    operation: 'add'
                },
                color: {
                    srcFactor: 'src-alpha',
                    dstFactor: 'one-minus-src-alpha',
                    operation: 'add'
                }
            }
        };

        const fragment: GPUFragmentState = {
            module: this.shader.fragModule,
            entryPoint: 'main',
            targets: [colorState]
        };

        const primitive: GPUPrimitiveState = {
            frontFace: 'ccw',
            cullMode: 'back',
            topology: topology
        };

        const pipelineDesc: GPURenderPipelineDescriptor = {
            layout: 'auto',
            vertex,
            fragment,
            primitive,
            depthStencil
        };

        this.pipeline = WebGPUContext.device.createRenderPipeline(pipelineDesc);
        this.shader.createBindGroup(this.pipeline);
    }
}