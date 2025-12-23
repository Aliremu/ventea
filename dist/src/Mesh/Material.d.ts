/// <reference types="dist" />
import { Shader } from "../Render/Shader";
import { Resource } from "../Resource";
export interface Descriptor {
    textures?: [];
}
export declare class Material extends Resource<Material> {
    shader: Shader;
    descriptor: Map<string, any>;
    bindGroup: GPUBindGroup | undefined;
    constructor(shader: Shader);
    set(name: string, resource: any): void;
    build(): void;
}
