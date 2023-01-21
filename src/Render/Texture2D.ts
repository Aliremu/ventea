import { Resource } from "../Resource";
import { API, Renderer } from "./Renderer";
import { TextureFormat } from './TextureFormat';
import { WebGLTexture2D } from "./WebGL/WebGLTexture2D";
import { WebGPUTexture2D } from "./WebGPU/WebGPUTexture2D";

export interface ITexture2D {
    setData(data: Uint8Array | ImageBitmap): void;
}

export class Texture2D extends Resource<Texture2D> {
    public _impl: ITexture2D;

    static DEFAULT_TEXTURE: Texture2D;
    static NORMAL_TEXTURE: Texture2D;

    constructor(width: number, height: number, format: TextureFormat = TextureFormat.BGRA8UNORM, mip: boolean = false) {
        super();

        switch(Renderer.api) {
            case API.WebGL: 
                this._impl = new WebGLTexture2D(width, height, format, mip);
                break;
            case API.WebGPU: 
                this._impl = new WebGPUTexture2D(width, height, format, mip);
                break;
        }
    }

    getImpl(): ITexture2D {
        return this._impl;
    }

    as<T>(): T {
        return this._impl as unknown as T;
    }

    setData(data: Uint8Array | ImageBitmap): void {
        this._impl.setData(data);
    }
}