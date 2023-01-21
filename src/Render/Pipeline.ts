import hash from "object-hash";
import { API, Renderer } from "./Renderer";
import { Shader } from "./Shader";
import { WebGLPipeline } from "./WebGL/WebGLPipeline";
import { WebGPUPipieline } from "./WebGPU/WebGPUPipeline";

export enum ShaderType {
    Int,
    Int2,
    Int3,
    Int4,
    Float,
    Float2,
    Float3,
    Float4
}

export interface VertexLayout {
    type: ShaderType;
    name: string;
}

export interface PipelineLayout {
    layout: VertexLayout[];
    backfaceCull: boolean;
    depthTest: boolean;
    wireframe: boolean;
    shader: Shader;
    // renderPass: RenderPass; //TODO
}

export interface IPipeline {
    layout: PipelineLayout;
}

let pipelineMap: Map<string, IPipeline> = new Map();
let count = 0;

export class Pipeline {
    public _impl: IPipeline;
    constructor(layout: PipelineLayout) {
        const key = hash(layout as any, { excludeKeys: (key: string) => {
            if(key == 'shader') {
                return true;
            }

            return false;
        } });

        if(false) {//pipelineMap.has(key)) {
            this._impl = pipelineMap.get(key) as IPipeline;
        } else {
            switch(Renderer.api) {
                case API.WebGL: 
                    this._impl = new WebGLPipeline(layout);  
                    break;
                case API.WebGPU: 
                    this._impl = new WebGPUPipieline(layout);  
                    break;
            }

            pipelineMap.set(key, this._impl);
        }

        console.log(++count, 'Pipelines!');
    }

    as<T>(): T {
        return this._impl as unknown as T;
    }
}