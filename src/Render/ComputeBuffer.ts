import { WebGPUContext } from "./WebGPU/WebGPUContext";

export class ComputeBuffer {
    public buffer: GPUBuffer;
    public data: ArrayBuffer;
    public size: number;

    private stagingBuffer: GPUBuffer;

    constructor(public count: number, public stride: number) {
        this.size = (count * stride + 3) & ~3;
        this.data = new ArrayBuffer(this.size);

        const desc: GPUBufferDescriptor = {
            size: this.size,
            usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC | GPUBufferUsage.COPY_DST
        };

        const buffer = WebGPUContext.device.createBuffer(desc);

        this.buffer = buffer;

        const stagingDesc: GPUBufferDescriptor = {
            size: this.size,
            usage: GPUBufferUsage.MAP_READ | GPUBufferUsage.COPY_DST
        };

        this.stagingBuffer = WebGPUContext.device.createBuffer(stagingDesc);
    }

    setData(bufferOffset: number, data: BufferSource | SharedArrayBuffer, dataOffset?: number | undefined, size?: number | undefined): void {
        WebGPUContext.queue.writeBuffer(this.buffer, bufferOffset, data, dataOffset, size);
    }

    getData(): Promise<ArrayBuffer> {
        const device = WebGPUContext.device;
        const commandEncoder = device.createCommandEncoder();
        commandEncoder.copyBufferToBuffer(this.buffer, 0, this.stagingBuffer, 0, this.size);
        const commands = commandEncoder.finish();
        device.queue.submit([commands]);

        return new Promise(async resolve => {
            await this.stagingBuffer.mapAsync(GPUMapMode.READ, 0, this.size);
            const copyArrayBuffer = this.stagingBuffer.getMappedRange(0, this.size);
            const data = copyArrayBuffer.slice(0);
            this.stagingBuffer.unmap();

            resolve(data);
        });
    }
}