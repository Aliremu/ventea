/// <reference types="dist" />
import { RendererContext } from "../RendererContext";
export declare class WebGPUContext extends RendererContext {
    static device: GPUDevice;
    static queue: GPUQueue;
    static context: GPUCanvasContext;
    static canvas: HTMLCanvasElement;
    static create(canvas: HTMLCanvasElement): Promise<void>;
}
