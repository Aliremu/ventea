import { Texture2D } from "./Texture2D";

export interface RenderPassSpecification {
    target: Texture2D
}

export class RenderPass {
    constructor(public specification: RenderPassSpecification) {
        
    }
}