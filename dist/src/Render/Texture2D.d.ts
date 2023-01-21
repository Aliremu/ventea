import { Resource } from "../Resource";
import { TextureFormat } from './TextureFormat';
export interface ITexture2D {
    setData(data: Uint8Array | ImageBitmap): void;
}
export declare class Texture2D extends Resource<Texture2D> {
    _impl: ITexture2D;
    static DEFAULT_TEXTURE: Texture2D;
    static NORMAL_TEXTURE: Texture2D;
    constructor(width: number, height: number, format?: TextureFormat, mip?: boolean);
    getImpl(): ITexture2D;
    as<T>(): T;
    setData(data: Uint8Array | ImageBitmap): void;
}
