/// <reference types="dist" />
import { Pipeline } from "../Render/Pipeline";
export interface Descriptor {
    textures?: [];
}
export declare class Material {
    descriptor: Map<string, any>;
    bindGroup?: GPUBindGroup;
    pipeline?: Pipeline;
    constructor();
    test(video: HTMLVideoElement): void;
    set(name: string, resource: any): void;
    build(): void;
}
