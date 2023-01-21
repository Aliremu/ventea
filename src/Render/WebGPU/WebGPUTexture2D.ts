import { ITexture2D } from "../Texture2D";
import { TextureFormat } from "../TextureFormat";
import { WebGPUContext } from "./WebGPUContext";

const FORMAT_MAP: Map<TextureFormat, GPUTextureFormat> = new Map<TextureFormat, GPUTextureFormat>([
    [TextureFormat.BGRA8UNORM, 'bgra8unorm'],
    [TextureFormat.BGRA8SRGB, 'bgra8unorm-srgb']
]);

export class WebGPUTexture2D implements ITexture2D {
    public texture: GPUTexture;
    public textureView: GPUTextureView;

    public width: number;
    public height: number;
    public format: TextureFormat;
    public mip: boolean;

    public sampler: GPUSampler;

    constructor(width: number, height: number, format: TextureFormat, mip: boolean) {
        const textureDesc: GPUTextureDescriptor = {
            size: [width, height],
            dimension: '2d',
            format: FORMAT_MAP.get(format)!,
            usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST | GPUTextureUsage.RENDER_ATTACHMENT
        };

        this.width = width;
        this.height = height;
        this.format = format;
        this.mip = mip;

        if(mip) {
            textureDesc.mipLevelCount = Math.floor(Math.log2(Math.max(this.width, this.height))) + 1;
        }

        this.texture = WebGPUContext.device.createTexture(textureDesc);
        this.textureView = this.texture.createView();

        this.sampler = WebGPUContext.device.createSampler({
            magFilter: 'nearest',
            minFilter: 'linear',
            addressModeU: 'repeat',
            addressModeV: 'repeat',
            mipmapFilter: 'linear'
        });

        const data = new Uint8Array(width * height * 4).fill(0xFF);

        WebGPUContext.queue.writeTexture({ texture: this.texture }, data, 
        {
            offset: 0,
            bytesPerRow: width * 4,
            rowsPerImage: height
        }, [width, height]);
    }

    setData(data: Uint8Array | ImageBitmap | HTMLVideoElement): void {
        if(data instanceof Uint8Array) {
            WebGPUContext.queue.writeTexture({ texture: this.texture }, data, 
            {
                offset: 0,
                bytesPerRow: this.width * 4,
                rowsPerImage: this.height
            }, [this.width, this.height]);
        } else {
            WebGPUContext.queue.copyExternalImageToTexture({ source: data }, { texture: this.texture }, [this.width, this.height]);
        }
        if(this.mip) {
            const textureDesc: GPUTextureDescriptor = {
                size: [this.width, this.height],
                dimension: '2d',
                format: 'bgra8unorm',
                usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST | GPUTextureUsage.RENDER_ATTACHMENT
            };

            textureDesc.mipLevelCount = Math.floor(Math.log2(Math.max(this.width, this.height))) + 1;
            this.generateMipmaps(textureDesc);
        }
    }

    /*constructor(width: number, height: number, data: ImageBitmap | null, format: GPUTextureFormat = 'bgra8unorm', def: boolean = false) {
        if(def) {
            const textureDesc: GPUTextureDescriptor = {
                size: [width, height],
                dimension: '2d',
                // format: 'bgra8unorm',
                format: format,
                usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST | GPUTextureUsage.RENDER_ATTACHMENT
            };
    
            this.width = width;
            this.height = height;
    
            this.texture = WebGPUContext.device.createTexture(textureDesc);
            this.textureView = this.texture.createView();
    
            this.sampler = WebGPUContext.device.createSampler({
                magFilter: 'linear',
                minFilter: 'linear',
                addressModeU: 'repeat',
                addressModeV: 'repeat'
            });

            // let test = new ArrayBuffer(4);
            // let buf = new Uint8Array(test);
            // buf[0] = 0xFF;
            // buf[1] = 0xFF;
            // buf[2] = 0xFF;
            // buf[3] = 0xFF;

            let test = new ArrayBuffer(width * height * 4);
            let buf = new Uint8Array(test).fill(0xFF);

            WebGPUContext.queue.writeTexture({ texture: this.texture }, test, 
            {
                offset: 0,
                bytesPerRow: width * 4,
                rowsPerImage: height
            }, [width, height]);

            return;
        }

        const textureDesc: GPUTextureDescriptor = {
            size: [width, height],
            dimension: '2d',
            // format: 'bgra8unorm',
            format: format,
            usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST | GPUTextureUsage.RENDER_ATTACHMENT
        };

        if (true) {
            textureDesc.mipLevelCount = Math.floor(Math.log2(Math.max(width, height))) + 1;
            // Needed in order to use render passes to generate the mipmaps.
            //textureDesc.usage |= GPUTextureUsage.RENDER_ATTACHMENT;
          }

        this.width = width;
        this.height = height;

        this.texture = WebGPUContext.device.createTexture(textureDesc);
        this.textureView = this.texture.createView();

        this.sampler = WebGPUContext.device.createSampler({
            magFilter: 'linear',
            minFilter: 'linear',
            addressModeU: 'repeat',
            addressModeV: 'repeat',
            mipmapFilter: 'linear',
            //maxAnisotropy: 4.0
        });

        WebGPUContext.queue.copyExternalImageToTexture({ source: data! }, { texture: this.texture }, textureDesc.size);
        this.generateMipmaps(textureDesc);
    }*/

    generateMipmaps(textureDesc: GPUTextureDescriptor) {
        const device = WebGPUContext.device;
        // Create a simple shader that renders a fullscreen textured quad.
        const mipmapShaderModule = device.createShaderModule({
            code: `
                var<private> pos: array<vec2<f32>, 4> = array<vec2<f32>, 4>(
                vec2<f32>(-1.0, 1.0), vec2<f32>(1.0, 1.0),
                vec2<f32>(-1.0, -1.0), vec2<f32>(1.0, -1.0));
        
                struct VertexOutput {
                    @builtin(position) position: vec4<f32>,
                    @location(0) texCoord: vec2<f32>
                };
        
                @vertex
                fn vertexMain(@builtin(vertex_index) vertexIndex: u32) -> VertexOutput {
                    var output: VertexOutput;
                    output.texCoord = pos[vertexIndex] * vec2<f32>(0.5, -0.5) + vec2<f32>(0.5);
                    output.position = vec4<f32>(pos[vertexIndex], 0.0, 1.0);
                    return output;
                }
        
                @group(0) @binding(0) var imgSampler: sampler;
                @group(0) @binding(1) var img: texture_2d<f32>;
        
                @fragment
                    fn fragmentMain(@location(0) texCoord: vec2<f32>) -> @location(0) vec4<f32> {
                    return textureSample(img, imgSampler, texCoord);
                }
            `
        });

        const pipeline: GPURenderPipeline = device.createRenderPipeline({
            layout: 'auto',
            vertex: {
                module: mipmapShaderModule,
                entryPoint: 'vertexMain',
            },
            fragment: {
                module: mipmapShaderModule,
                entryPoint: 'fragmentMain',
                targets: [{
                    format: textureDesc.format // Make sure to use the same format as the texture
                }],
            },
            primitive: {
                topology: 'triangle-strip',
                stripIndexFormat: 'uint32',
            },
        });

        // We'll ALWAYS be rendering minified here, so that's the only filter mode we need to set.
        const sampler = device.createSampler({ minFilter: 'linear' });

        let srcView = this.texture.createView({
            baseMipLevel: 0,
            mipLevelCount: 1
        });

        // Loop through each mip level and renders the previous level's contents into it.
        const commandEncoder = device.createCommandEncoder({});
        for (let i = 1; i < textureDesc.mipLevelCount!; ++i) {
            const dstView = this.texture.createView({
                baseMipLevel: i,  // Make sure we're getting the right mip level...
                mipLevelCount: 1, // And only selecting one mip level
            });

            const passEncoder = commandEncoder.beginRenderPass({
                colorAttachments: [{
                    view: dstView, // Render pass uses the next mip level as it's render attachment.
                    loadOp: 'clear',
                    storeOp: 'store'
                }],
            });

            // Need a separate bind group for each level to ensure
            // we're only sampling from the previous level.
            const bindGroup = device.createBindGroup({
                layout: pipeline.getBindGroupLayout(0),
                entries: [{
                    binding: 0,
                    resource: sampler,
                }, {
                    binding: 1,
                    resource: srcView,
                }],
            });

            // Render
            passEncoder.setPipeline(pipeline);
            passEncoder.setBindGroup(0, bindGroup);
            passEncoder.draw(4);
            passEncoder.end();

            // The source texture view for the next iteration of the loop is the
            // destination view for this one.
            srcView = dstView;
        }
        device.queue.submit([commandEncoder.finish()]);
    }
}