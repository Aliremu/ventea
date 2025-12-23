/// <reference types="dist" />
import { Sampler } from "../Sampler";
import { ITexture2D } from "../Texture2D";
import { TextureFormat } from "../TextureFormat";
export declare class WebGPUTexture2D implements ITexture2D {
    width: number;
    height: number;
    format: TextureFormat;
    options: Sampler;
    texture: GPUTexture;
    textureView: GPUTextureView;
    sampler: GPUSampler;
    constructor(width: number, height: number, format: TextureFormat, options: Sampler);
    resize(width: number, height: number): void;
    setData(data: Uint8Array | ImageBitmap | HTMLVideoElement): void;
    generateMipmaps(textureDesc: GPUTextureDescriptor): void;
}
