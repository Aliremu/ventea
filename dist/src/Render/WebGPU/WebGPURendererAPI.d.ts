/// <reference types="dist" />
import { Camera } from "../../Camera/Camera";
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
    beginRenderPass(time: number, camera: Camera): void;
    endRenderPass(): void;
    static create(canvas: HTMLCanvasElement): Promise<RendererAPI>;
    submitMesh(scene: Scene, time: number, camera: Camera, mesh: Mesh, pipeline: Pipeline): void;
    renderScene(scene: Scene, time: number, camera: Camera, pipe?: Pipeline): void;
    drawIndexed(size: number): void;
    resize(width: number, height: number): void;
}
