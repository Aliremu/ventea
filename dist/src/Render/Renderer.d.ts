import { mat4 } from 'gl-matrix';
import { Camera } from '../Camera/Camera';
import { Scene } from '../Scene/Scene';
import { CommandBuffer } from './CommandBuffer';
import { RendererContext } from './RendererContext';
import { Pipeline } from './Pipeline';
export declare enum API {
    WebGL = 0,
    WebGPU = 1
}
export declare class Renderer {
    static api: API;
    static context: RendererContext;
    static commandBuffer: CommandBuffer;
    static instanceList: Map<number, Array<mat4>>;
    static debugPipeline: Pipeline;
    static init(canvas: HTMLCanvasElement, api?: API): Promise<void>;
    static beginRenderPass(time: number, camera: Camera): void;
    static endRenderPass(): void;
    static submit(fn: Function): void;
    static createMap(scene: Scene): void;
    static renderScene(scene: Scene, time: number, camera: Camera): void;
    static resize(width: number, height: number): void;
}
