/// <reference types="dist" />
import { IPipeline, PipelineLayout } from "../Pipeline";
import { WebGPUShader } from "./WebGPUShader";
export declare class WebGPUPipieline implements IPipeline {
    layout: PipelineLayout;
    pipeline: GPURenderPipeline;
    shader: WebGPUShader;
    constructor(layout: PipelineLayout);
}
