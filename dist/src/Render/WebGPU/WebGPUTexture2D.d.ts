/// <reference types="dist" />
import { ITexture2D } from "../Texture2D";
import { TextureFormat } from "../TextureFormat";
export declare class WebGPUTexture2D implements ITexture2D {
    texture: GPUTexture;
    textureView: GPUTextureView;
    width: number;
    height: number;
    format: TextureFormat;
    mip: boolean;
    sampler: GPUSampler;
    constructor(width: number, height: number, format: TextureFormat, mip: boolean);
    setData(data: Uint8Array | ImageBitmap | HTMLVideoElement): void;
    generateMipmaps(textureDesc: GPUTextureDescriptor): void;
}
