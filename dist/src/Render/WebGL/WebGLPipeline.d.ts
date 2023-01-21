import { IPipeline, PipelineLayout } from "../Pipeline";
import { WebGLShader } from "./WebGLShader";
export declare class WebGLPipeline implements IPipeline {
    layout: PipelineLayout;
    shader: WebGLShader;
    constructor(layout: PipelineLayout);
}
