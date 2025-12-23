import { RendererContext } from "../RendererContext";
export declare class WebGLContext extends RendererContext {
    static gl: WebGL2RenderingContext;
    static ext: WEBGL_multi_draw;
    static canvas: HTMLCanvasElement;
    static create(canvas: HTMLCanvasElement): Promise<void>;
}
