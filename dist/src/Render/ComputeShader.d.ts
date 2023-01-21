import { ComputeBuffer } from "./ComputeBuffer";
export declare class ComputeShader {
    private module;
    private pipeline;
    private descriptor;
    private bindGroup?;
    private entires;
    constructor(src: string);
    setBuffer(name: string, buffer: ComputeBuffer): void;
    dispatch(x: number, y?: number, z?: number): void;
}
