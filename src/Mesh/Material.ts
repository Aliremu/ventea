import { Pipeline } from "../Render/Pipeline";
import { API, Renderer } from "../Render/Renderer";
import { Texture2D } from "../Render/Texture2D";
import { UniformBuffer } from "../Render/UniformBuffer";
import { WebGLContext } from "../Render/WebGL/WebGLContext";
import { WebGLPipeline } from "../Render/WebGL/WebGLPipeline";
import { WebGLUniformBuffer } from "../Render/WebGL/WebGLUniformBuffer";
import { WebGPUContext } from "../Render/WebGPU/WebGPUContext";
import { WebGPUPipieline } from "../Render/WebGPU/WebGPUPipeline";
import { WebGPUTexture2D } from "../Render/WebGPU/WebGPUTexture2D";
import { WebGPUUniformBuffer } from "../Render/WebGPU/WebGPUUniformBuffer";

export interface Descriptor {
    textures?: [];
}

export class Material {
    public descriptor: Map<string, any>;
    public bindGroup?: GPUBindGroup;
    public pipeline?: Pipeline;

    constructor() {
        this.descriptor = new Map();
    }

    test(video: HTMLVideoElement) {
        // const response = await fetch('nothingonme.mp4');
        // const blob = await response.blob();

        // const imgBitmap = await createImageBitmap(blob);
        // const texture = WebGPUContext.device.importExternalTexture({ source: video });

        // WebGPUContext.queue.copyExternalImageToTexture({ source: video }, { texture: WebGPUTexture.TEST_TEXTURE.texture }, [1280, 720]);
    }

    set(name: string, resource: any): void {
        this.descriptor.set(name, resource);
    }

    /*change(tex: VideoTexture) {
        this.descriptor[1] = {
            binding: 1,
            resource: tex.as<WebGPUVideoTexture>().texture?.textureView
        };
    }*/

    build(): void {
        if(Renderer.api === API.WebGL) {
            const gl = WebGLContext.gl;
            const shader = this.pipeline?.as<WebGLPipeline>().shader;
            for (const [name, resource] of this.descriptor) {
                const binding = shader?.uniforms.get(name);

                if(resource instanceof UniformBuffer) {
                    const buffer = resource.as<WebGLUniformBuffer>();
                    gl.uniformBlockBinding(shader?.program!, gl.getUniformBlockIndex(shader?.program!, name), 0);
                }
            }

            return;
        }

        const shader = this.pipeline?.as<WebGPUPipieline>().shader;
        if(!shader?.bindGroups[2]) return;

        let entries: GPUBindGroupEntry[] = [];
        for (const [name, resource] of this.descriptor) {
            const binding = shader.bindGroups[2].get(name);

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

        console.log("THE CUM BUCKET", entries, this.descriptor, entries.length);

        this.bindGroup = WebGPUContext.device.createBindGroup({
            layout: this.pipeline!.as<WebGPUPipieline>().pipeline.getBindGroupLayout(2),
            entries: entries
        });
    }
}