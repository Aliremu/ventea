import { RendererContext } from "../RendererContext";
export declare class WebGLContext extends RendererContext {
    static gl: WebGL2RenderingContext;
    static canvas: HTMLCanvasElement;
    static create(canvas: HTMLCanvasElement): Promise<void>;
}
