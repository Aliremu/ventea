import { Renderer } from "../Renderer";
import { WebGPUContext } from "./WebGPUContext";

export class WebGPUStorageBuffer {
    public buffer: GPUBuffer;
    public data: Float32Array | Uint16Array;
    public size: number;

    constructor(size: number) {
        this.data = new Float32Array(size);

        this.size = size;

        const desc: GPUBufferDescriptor = {
            size: (this.data.byteLength + 3) & ~3,
            usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
            mappedAtCreation: true
        };

        const buffer = WebGPUContext.device.createBuffer(desc);

        const writeArray = new Float32Array(buffer.getMappedRange());
        writeArray.set(this.data);
        buffer.unmap();

        this.buffer = buffer;
    }

    setData(bufferOffset: number, data: BufferSource | SharedArrayBuffer, dataOffset?: number | undefined, size?: number | undefined): void {
        WebGPUContext.queue.writeBuffer(this.buffer, bufferOffset, data, dataOffset, size);
    }
}