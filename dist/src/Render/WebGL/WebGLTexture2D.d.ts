import { ITexture2D } from "../Texture2D";
import { TextureFormat } from "../TextureFormat";
export declare class WebGLTexture2D implements ITexture2D {
    width: number;
    height: number;
    format: TextureFormat;
    mip: boolean;
    texture: number;
    constructor(width: number, height: number, format: TextureFormat, mip: boolean);
    setData(data: Uint8Array | ImageBitmap): void;
}
