import { Resource } from "../Resource";
import { Sampler } from "./Sampler";
import { TextureFormat } from './TextureFormat';
export interface ITexture2D {
    setData(data: Uint8Array | ImageBitmap): void;
    resize(width: number, height: number): void;
}
export declare class Texture2D extends Resource<Texture2D> {
    _impl: ITexture2D;
    static DEFAULT_TEXTURE: Texture2D;
    static NORMAL_TEXTURE: Texture2D;
    constructor(width: number, height: number, format?: TextureFormat, options?: Partial<Sampler>);
    getImpl(): ITexture2D;
    as<T>(): T;
    setData(data: Uint8Array | ImageBitmap): void;
    resize(width: number, height: number): void;
}
