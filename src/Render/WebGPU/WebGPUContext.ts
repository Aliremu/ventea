// @ts-nocheck

import { RendererContext } from "../RendererContext";

export class WebGPUContext extends RendererContext {
    static device: GPUDevice;
    static queue: GPUQueue;
    static context: GPUCanvasContext;
    static canvas: HTMLCanvasElement;

    static async create(canvas: HTMLCanvasElement) {
        this.canvas = canvas;

        if (!navigator.gpu) throw Error("WebGPU is not Supported!");

        const adapter = await navigator.gpu.requestAdapter();
        if (!adapter) throw Error("Could not Request WebGPU Adapter");

        this.device = await adapter.requestDevice();
        if (!this.device) throw Error("Could not Find Device");

        this.queue = this.device.queue;

        const context = canvas.getContext('webgpu');
        if (!context) throw Error("Could not Create WebGPU Context");
        this.context = context;
        
        const config: GPUCanvasConfiguration = {
            device: this.device,
            format: 'bgra8unorm',
            usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.COPY_SRC,
            alphaMode: 'opaque'
        };

        context.configure(config);
    }
}