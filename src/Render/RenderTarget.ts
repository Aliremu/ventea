import { Utils } from "../Math/Utils";
import { Resource } from "../Resource";
import { API, Renderer } from "./Renderer";
import { Sampler, SamplerFilter, Wrap } from "./Sampler";
import { TextureFormat } from './TextureFormat';
import { WebGLRenderTarget } from "./WebGL/WebGLRenderTarget";
import { WebGLTexture2D } from "./WebGL/WebGLTexture2D";
import { WebGPUTexture2D } from "./WebGPU/WebGPUTexture2D";

export interface IRenderTarget {
    bind(): void;
    unbind(): void;
    readPixels(): Uint8Array;
}

export class RenderTarget {
    public _impl: IRenderTarget;

    constructor(width: number, height: number, format: TextureFormat = TextureFormat.BGRA8UNORM, options?: Partial<Sampler>) {
        options = Utils.merge(options, {
            wrapS: Wrap.Repeat,
            wrapT: Wrap.Repeat,
            minFilter: SamplerFilter.Linear,
            magFilter: SamplerFilter.Linear,
            mip: false
        });

        switch(Renderer.api) {
            case API.WebGL: 
                this._impl = new WebGLRenderTarget(width, height);
                break;
            case API.WebGPU: 
                throw new Error("RenderTarget not implemented for WebGPU!");
                break;
        }
    }

    getImpl(): IRenderTarget {
        return this._impl;
    }

    as<T>(): T {
        return this._impl as unknown as T;
    }

    bind(): void {
        this._impl.bind();
    }

    unbind(): void {
        this._impl.unbind();
    }

    readPixels(): Uint8Array {
        return this._impl.readPixels();
    }
}