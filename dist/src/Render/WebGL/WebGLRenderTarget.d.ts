import { IRenderTarget } from "../RenderTarget";
import { Texture2D } from "../Texture2D";
export declare class WebGLRenderTarget implements IRenderTarget {
    width: number;
    height: number;
    colorAttachment: Texture2D;
    frameBuffer: WebGLFramebuffer;
    constructor(width: number, height: number);
    bind(): void;
    unbind(): void;
    readPixels(): Uint8Array;
}
