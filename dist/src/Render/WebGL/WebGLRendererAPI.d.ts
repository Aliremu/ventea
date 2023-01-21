import { Camera } from "../../Camera/Camera";
import { Scene } from "../../Scene/Scene";
import { Pipeline } from "../Pipeline";
import { RendererAPI } from "../RendererAPI";
import { WebGLUniformBuffer } from "./WebGLUniformBuffer";
export declare class WebGLRendererAPI extends RendererAPI {
    static lightsBuffer: WebGLUniformBuffer;
    static create(canvas: HTMLCanvasElement): Promise<RendererAPI>;
    beginRenderPass(time: number, camera: Camera): void;
    endRenderPass(): void;
    drawIndexed(size: number): void;
    renderScene(scene: Scene, time: number, camera: Camera, pipe?: Pipeline): void;
    resize(width: number, height: number): void;
}
