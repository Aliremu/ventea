import { Shader } from "./Shader";
export declare enum ShaderType {
    Int = 0,
    Int2 = 1,
    Int3 = 2,
    Int4 = 3,
    Float = 4,
    Float2 = 5,
    Float3 = 6,
    Float4 = 7
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
}
export interface IPipeline {
    layout: PipelineLayout;
}
export declare class Pipeline {
    _impl: IPipeline;
    constructor(layout: PipelineLayout);
    as<T>(): T;
}
