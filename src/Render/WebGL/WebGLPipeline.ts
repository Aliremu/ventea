import { IPipeline, PipelineLayout } from "../Pipeline";
import { Shader } from "../Shader";
import { WebGLShader } from "./WebGLShader";

export class WebGLPipeline implements IPipeline {
    public shader: WebGLShader;

    constructor(public layout: PipelineLayout) {
        this.shader = layout.shader.as<WebGLShader>();
        //this.shader = new WebGLShader('', '');
    }
}