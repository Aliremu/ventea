import { Renderer } from "../Renderer";
import { IVertexBuffer, VertexBuffer } from "../VertexBuffer";
import { WebGPUContext } from "./WebGPUContext";

export class WebGPUVertexBuffer implements IVertexBuffer {
    public buffer: GPUBuffer;
    public data: Float32Array;
    public size: number;

    constructor(data: Float32Array, size: number) {
        const desc: GPUBufferDescriptor = {
            size: (data.byteLength + 3) & ~3,
            usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
            mappedAtCreation: true
        };

        const buffer = WebGPUContext.device.createBuffer(desc);

        const writeArray = new Float32Array(buffer.getMappedRange());
        writeArray.set(data);
        buffer.unmap();

        this.buffer = buffer;
        this.data = data;
        this.size = size;
    }

    setData(data: Float32Array): void {
        WebGPUContext.queue.writeBuffer(this.buffer, 0, data, 0, data.length);
    }
}