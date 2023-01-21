import { Renderer } from "../Renderer";
import { IUniformBuffer } from "../UniformBuffer";
import { WebGPUContext } from "./WebGPUContext";

export class WebGPUUniformBuffer implements IUniformBuffer {
    public buffer: GPUBuffer;
    public data: Float32Array | Uint16Array;
    public size: number;

    constructor(size: number) {
        this.data = new Float32Array(size);

        this.size = size;

        const desc: GPUBufferDescriptor = {
            size: (this.data.byteLength + 3) & ~3,
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
            mappedAtCreation: true
        };

        const buffer = WebGPUContext.device.createBuffer(desc);

        const writeArray = new Float32Array(buffer.getMappedRange());
        writeArray.set(this.data);
        buffer.unmap();

        this.buffer = buffer;
    }

    setData(bufferOffset: number, data: BufferSource | SharedArrayBuffer, dataOffset?: number | undefined, size?: number | undefined): void {
        WebGPUContext.queue.writeBuffer(this.buffer, 0, data, 0, size);
    }
}