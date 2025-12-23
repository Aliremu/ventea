import { Texture2D } from "./Texture2D";
export interface RenderPassSpecification {
    target: Texture2D;
}
export declare class RenderPass {
    specification: RenderPassSpecification;
    constructor(specification: RenderPassSpecification);
}
