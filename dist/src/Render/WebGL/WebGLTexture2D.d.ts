import { Sampler } from "../Sampler";
import { ITexture2D } from "../Texture2D";
import { TextureFormat } from "../TextureFormat";
export declare class WebGLTexture2D implements ITexture2D {
    width: number;
    height: number;
    format: TextureFormat;
    options: Sampler;
    texture: number;
    constructor(width: number, height: number, format: TextureFormat, options: Sampler);
    resize(width: number, height: number): void;
    setData(data: Uint8Array | Float32Array | ImageBitmap): void;
}
