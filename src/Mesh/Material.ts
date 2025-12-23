import { API, Renderer } from "../Render/Renderer";
import { Shader } from "../Render/Shader";
import { Texture2D } from "../Render/Texture2D";
import { UniformBuffer } from "../Render/UniformBuffer";
import { WebGLContext } from "../Render/WebGL/WebGLContext";
import { WebGLShader } from "../Render/WebGL/WebGLShader";
import { WebGLUniformBuffer } from "../Render/WebGL/WebGLUniformBuffer";
import { WebGPUContext } from "../Render/WebGPU/WebGPUContext";
import { WebGPUShader } from "../Render/WebGPU/WebGPUShader";
import { WebGPUTexture2D } from "../Render/WebGPU/WebGPUTexture2D";
import { WebGPUUniformBuffer } from "../Render/WebGPU/WebGPUUniformBuffer";
import { Resource } from "../Resource";

export interface Descriptor {
    textures?: [];
}

export class Material extends Resource<Material> {
    public descriptor: Map<string, any>;
    public bindGroup: GPUBindGroup | undefined;

    constructor(public shader: Shader) {
        super();

        this.descriptor = new Map();
    }

    set(name: string, resource: any): void {
        this.descriptor.set(name, resource);
    }

    build(): void {
        if(Renderer.api === API.WebGL) {
            const gl = WebGLContext.gl;
            const shader = this.shader.as<WebGLShader>();
            for (const [name, resource] of this.descriptor) {
                const binding = shader?.uniforms.get(name);

                if(resource instanceof UniformBuffer) {
                    const buffer = resource.as<WebGLUniformBuffer>();
                    gl.uniformBlockBinding(shader?.program!, gl.getUniformBlockIndex(shader?.program!, name), 0);
                }
            }

            return;
        }

        const shader = this.shader.as<WebGPUShader>();
        if(!shader?.bindGroups[2]) return;

        let entries: GPUBindGroupEntry[] = [];
        for (const [name, resource] of this.descriptor) {
            const binding = shader.bindGroups[2].get(name).binding;

            if(typeof binding === 'undefined') {
                console.log("NO BINDING");
                continue;
            }
            
            if (resource instanceof Texture2D) {
                const texture = resource.as<WebGPUTexture2D>();
                entries.push({ binding: binding!,     resource: texture.textureView });
                entries.push({ binding: binding! + 1, resource: texture.sampler });
            }

            if(resource instanceof UniformBuffer) {
                const buffer = resource.as<WebGPUUniformBuffer>();
                entries.push({ binding: binding!, resource: { buffer: buffer.buffer } });
            }
        }

        console.log("Material Descriptors", entries, this.descriptor, entries.length);

        this.bindGroup = WebGPUContext.device.createBindGroup({
            layout: shader.customBindGroupLayout,
            entries: entries
        });
    }
}