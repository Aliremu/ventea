import { defineQuery, pipe } from "bitecs";
import { mat4 } from "gl-matrix";
import { Camera } from "../../Camera/Camera";
import { Utils } from "../../Math/Utils";
import { Vector3 } from "../../Math/Vector";
import { Mesh } from "../../Mesh/Mesh";
import { Physics } from "../../Physics/Physics";
import { Resources } from "../../Resources";
import { LastPosition, Light, MeshRenderer, Position, Rotation, Scale } from "../../Scene/Components";
import { Scene } from "../../Scene/Scene";
import { Pipeline } from "../Pipeline";
import { Renderer } from "../Renderer";
import { RendererAPI } from "../RendererAPI";
import { Texture2D } from "../Texture2D";
import { WebGPUContext } from "./WebGPUContext";
import { WebGPUIndexBuffer } from "./WebGPUIndexBuffer";
import { WebGPUPipieline } from "./WebGPUPipeline";
import { WebGPUStorageBuffer } from "./WebGPUStorageBuffer";
import { WebGPUTexture2D } from "./WebGPUTexture2D";
import { WebGPUVertexBuffer } from "./WebGPUVertexBuffer";

let colorTexture: GPUTexture;
let colorTextureView: GPUTextureView;

let depthTexture: GPUTexture;
let depthTextureView: GPUTextureView;

const meshQuery = defineQuery([MeshRenderer]);
const lightQuery = defineQuery([Light]);

const MAX_TRANSFORMS = (1 << 15);
const MAX_LIGHTS = 64;

export class WebGPURendererAPI extends RendererAPI {
    static commandEncoder: GPUCommandEncoder;
    static passEncoder: GPURenderPassEncoder;

    static transformBuffer: WebGPUStorageBuffer;
    static lightsBuffer: WebGPUStorageBuffer;

    beginRenderPass(time: number, camera: Camera) {
        const device = WebGPUContext.device;
        const context = WebGPUContext.context;
        const canvas = WebGPUContext.canvas;
        const queue = WebGPUContext.queue;

        colorTexture = context.getCurrentTexture();
        colorTextureView = colorTexture.createView();

        //const transform = mat4.identity();

        // mesh1.pipeline.shader.writeUniformBuffer(0, 0, camera.viewMatrix, 0, 16);
        // mesh1.pipeline.shader.writeUniformBuffer(0, 64, camera.projectionMatrix, 0, 16);
        // mesh1.pipeline.shader.writeUniformBuffer(1, 0, mat4.identity(), 0, 16);

        // mesh2.pipeline.shader.writeUniformBuffer(0, 0, camera.viewMatrix, 0, 16);
        // mesh2.pipeline.shader.writeUniformBuffer(0, 64, camera.projectionMatrix, 0, 16);
        // mesh2.pipeline.shader.writeUniformBuffer(1, 0, mat4.translate(mat4.identity(), [5, 0, 0]), 0, 16);

        let colorAttachment: GPURenderPassColorAttachment = {
            view: colorTextureView,
            clearValue: { r: 0.95, g: 0.9, b: 0.85, a: 1 },
            loadOp: 'clear',
            storeOp: 'store'
        };

        const depthAttachment: GPURenderPassDepthStencilAttachment = {
            view: depthTextureView,
            depthClearValue: 1,
            depthLoadOp: 'clear',
            depthStoreOp: 'store',
            stencilClearValue: 0,
            stencilLoadOp: 'clear',
            stencilStoreOp: 'store'
        };

        const renderPassDesc: GPURenderPassDescriptor = {
            colorAttachments: [colorAttachment],
            depthStencilAttachment: depthAttachment
        };

        WebGPURendererAPI.commandEncoder = device.createCommandEncoder();
        WebGPURendererAPI.passEncoder = WebGPURendererAPI.commandEncoder.beginRenderPass(renderPassDesc);
    }

    endRenderPass() {
        WebGPURendererAPI.passEncoder.end();

        // WebGPURendererAPI.commandEncoder.copyTextureToTexture(
        //     {
        //         texture: colorTexture,
        //     },
        //     {
        //         texture: Texture2D.DEFAULT_TEXTURE.as<WebGPUTexture2D>().texture,
        //     },
        //     [WebGPUContext.canvas.width, WebGPUContext.canvas.height, 1]
        // );

        WebGPUContext.queue.submit([WebGPURendererAPI.commandEncoder.finish()]);
    }

    static async create(canvas: HTMLCanvasElement): Promise<RendererAPI> {
        await WebGPUContext.create(canvas);

        const device = WebGPUContext.device;
        const context = WebGPUContext.context;

        this.transformBuffer = new WebGPUStorageBuffer(MAX_TRANSFORMS * 64);
        this.lightsBuffer = new WebGPUStorageBuffer(MAX_LIGHTS * 32);

        const depthTextureDesc: GPUTextureDescriptor = {
            size: [canvas.width, canvas.height, 1],
            dimension: '2d',
            format: 'depth24plus-stencil8',
            usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.COPY_SRC
        };

        depthTexture = device.createTexture(depthTextureDesc);
        depthTextureView = depthTexture.createView();

        colorTexture = context.getCurrentTexture();
        colorTextureView = colorTexture.createView();

        return new WebGPURendererAPI();
    }

    submitMesh(scene: Scene, time: number, camera: Camera, mesh: Mesh, pipeline: Pipeline) {
        
    }

    renderScene(scene: Scene, time: number, camera: Camera, pipe?: Pipeline): void {
        let i = 0;
        const ents = meshQuery(scene.world);
        const lights = lightQuery(scene.world);
        let transform = mat4.create();
        const passEncoder = WebGPURendererAPI.passEncoder;
        let lastMesh = null;
        let lastPipeline = null;
        const alpha = Utils.clamp(50 * ((time - Physics.lastTime) / 1000), 0, 1);

        passEncoder.setViewport(0, 0, WebGPUContext.canvas.width, WebGPUContext.canvas.height, 0, 1);
        passEncoder.setScissorRect(0, 0, WebGPUContext.canvas.width, WebGPUContext.canvas.height);

        const trans = new Vector3();
    
        let offset = 0;

        for(const light of lights) {
            if(!scene.pool[light].isVisible) continue;

            const x = Position.x[light];
            const y = Position.y[light];
            const z = Position.z[light];

            const r = Light.color.x[light];
            const g = Light.color.y[light];
            const b = Light.color.z[light];

            const type = Light.type[light];

            WebGPURendererAPI.lightsBuffer.data[offset + 0] = x;
            WebGPURendererAPI.lightsBuffer.data[offset + 1] = y;
            WebGPURendererAPI.lightsBuffer.data[offset + 2] = z;

            WebGPURendererAPI.lightsBuffer.data[offset + 4] = r;
            WebGPURendererAPI.lightsBuffer.data[offset + 5] = g;
            WebGPURendererAPI.lightsBuffer.data[offset + 6] = b;

            WebGPURendererAPI.lightsBuffer.data[offset + 7] = type;

            offset += 8;
        }

        for (const eid of ents) {
            if(!scene.pool[eid].isVisible) continue;

            const mesh: Mesh = Resources.get<Mesh>(MeshRenderer.assetId[eid]);

            trans.x = Utils.lerp(LastPosition.x[eid], Position.x[eid], alpha);
            trans.y = Utils.lerp(LastPosition.y[eid], Position.y[eid], alpha);
            trans.z = Utils.lerp(LastPosition.z[eid], Position.z[eid], alpha);

            mat4.identity(transform);
            mat4.translate(transform, transform, trans.buffer);
            mat4.rotateY(transform, transform, Rotation.y[eid]);
            mat4.rotateX(transform, transform, Rotation.x[eid]);
            mat4.rotateZ(transform, transform, Rotation.z[eid]);
            mat4.scale(transform, transform, [Scale.x[eid], Scale.y[eid], Scale.z[eid]]);
            const pipeline = pipe ? pipe.as<WebGPUPipieline>() : mesh.pipeline.as<WebGPUPipieline>();

            WebGPURendererAPI.transformBuffer.data.set(transform, i * 16);

            //pipeline.shader.writeUniformBuffer(1, i * 64, transform, 0, 16);
            // VENTEA.math.mat4.translate(transform, [5, 1, 0], transform);
            // mesh.pipeline.shader.writeUniformBuffer(1, 0, VENTEA.math.mat4.translate(VENTEA.math.mat4.identity(), [0, 0, 20 * i]), 0, 16);
            //mesh.pipeline.shader.writeUniformBuffer(1, 0, VENTEA.math.mat4.scale(VENTEA.math.mat4.rotateX(VENTEA.math.mat4.identity(), -Math.PI / 2), [0.01, 0.01, 0.01]), 0, 16);

            if (lastPipeline != pipeline) {
                pipeline.shader.writeUniformBuffer(0, 0, camera.viewMatrix as Float32Array, 0, 16);
                pipeline.shader.writeUniformBuffer(0, 64, camera.projectionMatrix as Float32Array, 0, 16);
                passEncoder.setPipeline(pipeline.pipeline);
            }

            if (lastMesh != mesh) {
                passEncoder.setVertexBuffer(0, (mesh.positionBuffer.as<WebGPUVertexBuffer>()).buffer);
                passEncoder.setVertexBuffer(1, (mesh.normalBuffer.as<WebGPUVertexBuffer>()).buffer);
                passEncoder.setVertexBuffer(2, (mesh.texCoordBuffer.as<WebGPUVertexBuffer>()).buffer);
                passEncoder.setIndexBuffer((mesh.indexBuffer.as<WebGPUIndexBuffer>()).buffer, 'uint32');
                passEncoder.setBindGroup(0, pipeline.shader.uniformBindGroup);
                passEncoder.setBindGroup(1, pipeline.shader.transformBindGroup);
            }

            lastMesh = mesh;
            lastPipeline = pipeline;

            for (const s of mesh.subMeshes) {
                // console.log(pipeline, pipeline.shader.bindGroups);
                if (s.material?.bindGroup && pipeline.shader.bindGroups[2]) {
                    // console.log(s.material!.pipeline!.as<WebGPUPipieline>().pipeline);
                    // passEncoder.setPipeline(s.material!.pipeline!.as<WebGPUPipieline>().pipeline);
                    // console.log("WTF");
                    passEncoder.setBindGroup(2, s.material?.bindGroup);
                }

                passEncoder.drawIndexed(s.indexCount, 1, s.baseIndex, s.baseVertex, i);
            }

            i++;
        }

        WebGPURendererAPI.transformBuffer.setData(0, WebGPURendererAPI.transformBuffer.data, 0, 16 * i);
        WebGPURendererAPI.lightsBuffer.setData(0, WebGPURendererAPI.lightsBuffer.data, 0, offset);
    }

    drawIndexed(size: number): void {
    }

    resize(width: number, height: number): void {
        // Texture2D.DEFAULT_TEXTURE = new Texture2D(width, height);

        colorTexture.destroy();
        depthTexture.destroy();

        const device = WebGPUContext.device;
        const context = WebGPUContext.context;

        const depthTextureDesc: GPUTextureDescriptor = {
            size: [width, height, 1],
            dimension: '2d',
            format: 'depth24plus-stencil8',
            usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.COPY_SRC
        };

        depthTexture = device.createTexture(depthTextureDesc);
        depthTextureView = depthTexture.createView();

        colorTexture = context.getCurrentTexture();
        colorTextureView = colorTexture.createView();
    }
}