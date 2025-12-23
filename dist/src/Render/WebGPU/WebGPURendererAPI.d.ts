/// <reference types="dist" />
import { ICamera } from "../../Camera/ICamera";
import { Mesh } from "../../Mesh/Mesh";
import { Scene } from "../../Scene/Scene";
import { Pipeline } from "../Pipeline";
import { RendererAPI } from "../RendererAPI";
import { WebGPUStorageBuffer } from "./WebGPUStorageBuffer";
export declare class WebGPURendererAPI extends RendererAPI {
    static commandEncoder: GPUCommandEncoder;
    static passEncoder: GPURenderPassEncoder;
    static transformBuffer: WebGPUStorageBuffer;
    static lightsBuffer: WebGPUStorageBuffer;
    beginRenderPass(time: number, camera: ICamera): void;
    endRenderPass(scene: Scene): void;
    static create(canvas: HTMLCanvasElement): Promise<RendererAPI>;
    submitMesh(scene: Scene, time: number, camera: ICamera, mesh: Mesh, pipeline: Pipeline): void;
    renderScene(scene: Scene, time: number, camera: ICamera, pipe?: Pipeline): void;
    drawIndexed(size: number): void;
    resize(width: number, height: number): void;
}
