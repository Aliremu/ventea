import { Sampler } from "./Sampler";
import { TextureFormat } from './TextureFormat';
export interface IRenderTarget {
    bind(): void;
    unbind(): void;
    readPixels(): Uint8Array;
}
export declare class RenderTarget {
    _impl: IRenderTarget;
    constructor(width: number, height: number, format?: TextureFormat, options?: Partial<Sampler>);
    getImpl(): IRenderTarget;
    as<T>(): T;
    bind(): void;
    unbind(): void;
    readPixels(): Uint8Array;
}
