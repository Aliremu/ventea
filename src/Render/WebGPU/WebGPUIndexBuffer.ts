import { IIndexBuffer, IndexBuffer } from "../IndexBuffer";
import { Renderer } from "../Renderer";
import { WebGPUContext } from "./WebGPUContext";

export class WebGPUIndexBuffer implements IIndexBuffer {
    public buffer: GPUBuffer;
    public data: Uint32Array;
    public size: number;

    constructor(data: Uint32Array, size: number) {
        const desc: GPUBufferDescriptor = {
            size: (data.byteLength + 3) & ~3,
            usage: GPUBufferUsage.INDEX,
            mappedAtCreation: true
        };

        const buffer = WebGPUContext.device.createBuffer(desc);

        const writeArray = new Uint32Array(buffer.getMappedRange());
        writeArray.set(data);
        buffer.unmap();

        this.buffer = buffer;
        this.data = data;
        this.size = size;
    }

    setData(data: Uint32Array): void {
    }
}