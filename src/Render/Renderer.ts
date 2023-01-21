import { defineQuery } from 'bitecs';
import Stats, { Panel } from "stats.js";
import { mat4 } from 'gl-matrix';
import { Camera } from '../Camera/Camera';
import { Mesh } from '../Mesh/Mesh';
import { Resources } from '../Resources';
import { MeshRenderer, Position, Rotation, Scale } from '../Scene/Components';
import { Scene } from '../Scene/Scene';
import { CommandBuffer } from './CommandBuffer';
import { RendererAPI } from './RendererAPI';
import { RendererContext } from './RendererContext';
import { Texture2D } from './Texture2D';
import { WebGLRendererAPI } from './WebGL/WebGLRendererAPI';
import { WebGPUPipieline } from './WebGPU/WebGPUPipeline';
import { WebGPURendererAPI } from './WebGPU/WebGPURendererAPI';
import { Pipeline, ShaderType } from './Pipeline';
import debugSrc from './WebGPU/debug.wgsl';
import { PBRShaderMaterial } from './PBRShaderMaterial';
import { DebugShaderMaterial } from './DebugShaderMaterial';
import { Physics } from '../Physics/Physics';

export enum API {
    WebGL,
    WebGPU
}

let _canvas: HTMLCanvasElement;
let _api: RendererAPI;
let _stats: Stats;
let _tpsPanel: Panel;

const meshQuery = defineQuery([MeshRenderer]);

export class Renderer {
    static api: API;
    static context: RendererContext;
    static commandBuffer: CommandBuffer;

    static instanceList: Map<number, Array<mat4>> = new Map<number, Array<mat4>>();

    static debugPipeline: Pipeline;

    static async init(canvas: HTMLCanvasElement, api: API = API.WebGPU) {
        _canvas = canvas;

        _stats = new Stats();
        _tpsPanel = _stats.addPanel(new Stats.Panel('TPS', '#ff8', '#221'));
        _stats.showPanel(1); // 0: fps, 1: ms, 2: mb, 3+: custom
        document.body.appendChild(_stats.dom);

        this.api = api;
        this.commandBuffer = new CommandBuffer();

        switch (api) {
            case API.WebGL:
                _api = await WebGLRendererAPI.create(canvas);
                break;
            case API.WebGPU:
                _api = await WebGPURendererAPI.create(canvas);
                break;
            default:
                throw Error("Invalid Renderer API selected!");
                break;
        }

        Texture2D.DEFAULT_TEXTURE = new Texture2D(1, 1);
        Texture2D.NORMAL_TEXTURE = new Texture2D(1, 1);

        this.debugPipeline = new Pipeline({
            layout: [
                { name: 'position',  type: ShaderType.Float3 },
                { name: 'normal',    type: ShaderType.Float3 },
                { name: 'tex_coord', type: ShaderType.Float2 },
            ],
            backfaceCull: true,
            depthTest: true,
            shader: new DebugShaderMaterial(),
            wireframe: true
        });
    }

    static beginRenderPass(time: number, camera: Camera) {
        _stats.begin();
        _api.beginRenderPass(time, camera);
    }

    static endRenderPass() {
        for (const fn of this.commandBuffer) {
            fn(WebGPURendererAPI.passEncoder);
        }

        this.commandBuffer.clear();

        _api.endRenderPass();
        _stats.end();
    }

    static submit(fn: Function) {
        this.commandBuffer.push(fn);
    }

    static createMap(scene: Scene) {
        const ents = meshQuery(scene.world);

        if (this.instanceList.size > 0)
            this.instanceList.clear();

        for (const eid of ents) {
            const assetId = MeshRenderer.assetId[eid];

            let transform = mat4.create();
            mat4.identity(transform);
            mat4.translate(transform, transform, [Position.x[eid], Position.y[eid], Position.z[eid]]);
            mat4.rotateX(transform, transform, Rotation.x[eid]);
            mat4.rotateY(transform, transform, Rotation.y[eid]);
            mat4.rotateZ(transform, transform, Rotation.z[eid]);
            mat4.scale(transform, transform, [Scale.x[eid], Scale.y[eid], Scale.z[eid]]);

            if (!this.instanceList.has(assetId))
                this.instanceList.set(assetId, new Array<mat4>);

            this.instanceList.get(assetId)?.push(transform);
        }

        let i = 0;

        for (const [hash, arr] of this.instanceList) {
            const mesh: Mesh = Resources.get<Mesh>(hash);

            let count = 0;

            for (const t of arr) {
                mesh.pipeline.as<WebGPUPipieline>().shader.writeUniformBuffer(1, (i + count) * 64, t as Float32Array, 0, 16);
                count++;
            }

            i += count;
        }
    }

    static renderScene(scene: Scene, time: number, camera: Camera) {
        this.beginRenderPass(time, camera);

        // this.submit((passEncoder: GPURenderPassEncoder) => {
        //     let i = 0;

        //     for (const [uuid, arr] of this.instanceList) {
        //         const mesh: Mesh = Resources.get<Mesh>(uuid);

        //         passEncoder.setViewport(0, 0, _canvas.width, _canvas.height, 0, 1);
        //         passEncoder.setScissorRect(0, 0, _canvas.width, _canvas.height);

        //         const pipeline = mesh.pipeline.as<WebGPUPipieline>();

        //         passEncoder.setVertexBuffer(0, (mesh.positionBuffer.as<WebGPUVertexBuffer>()).buffer);
        //         passEncoder.setVertexBuffer(1, (mesh.normalBuffer.as<WebGPUVertexBuffer>()).buffer);
        //         passEncoder.setVertexBuffer(2, (mesh.texCoordBuffer.as<WebGPUVertexBuffer>()).buffer);
        //         passEncoder.setIndexBuffer((mesh.indexBuffer.as<WebGPUIndexBuffer>()).buffer, 'uint32');
        //         passEncoder.setBindGroup(0, pipeline.shader.uniformBindGroup);
        //         passEncoder.setBindGroup(1, pipeline.shader.transformBindGroup);
        //         passEncoder.setPipeline(pipeline.pipeline);
        //         pipeline.shader.writeUniformBuffer(0, 0, camera.viewMatrix, 0, 16);
        //         pipeline.shader.writeUniformBuffer(0, 64, camera.projectionMatrix, 0, 16);

                

        //         for (const s of mesh.subMeshes) {
        //             if (s.material?.bindGroup)
        //                 passEncoder.setBindGroup(2, s.material.bindGroup);

        //             passEncoder.drawIndexed(s.indexCount, arr.length, s.baseIndex, s.baseVertex, i);
        //         }

        //         i += arr.length;
        //     }
        // });

        // this.submit((passEncoder: GPURenderPassEncoder) => {
        //     {

        //         let i = 0;
        //         const ents = meshQuery(scene.world);
        //         let transform = mat4.create();

        //         let lastMesh = null;

        //         for (const eid of ents) {
        //             const arr = [
        //                 ...test(MeshRenderer.uuid.w0[eid]),
        //                 ...test(MeshRenderer.uuid.w1[eid]),
        //                 ...test(MeshRenderer.uuid.w2[eid]),
        //                 ...test(MeshRenderer.uuid.w3[eid])
        //             ];

        //             const uuid = uuidStringify(arr); //TODO costly

        //             const mesh: Mesh = Resources.get<Mesh>(uuid);

        //             mat4.identity(transform);
        //             mat4.translate(transform, [Position.x[eid], Position.y[eid], Position.z[eid]], transform);
        //             mat4.rotateX(transform, Rotation.x[eid], transform);
        //             mat4.rotateY(transform, Rotation.y[eid], transform);
        //             mat4.rotateZ(transform, Rotation.z[eid], transform);
        //             mat4.scale(transform, [Scale.x[eid], Scale.y[eid], Scale.z[eid]], transform);
        //             const pipeline = mesh.pipeline.as<WebGPUPipieline>();
        //             pipeline.shader.writeUniformBuffer(1, i * 64, transform, 0, 16);
        //             // VENTEA.math.mat4.translate(transform, [5, 1, 0], transform);
        //             // mesh.pipeline.shader.writeUniformBuffer(1, 0, VENTEA.math.mat4.translate(VENTEA.math.mat4.identity(), [0, 0, 20 * i]), 0, 16);
        //             //mesh.pipeline.shader.writeUniformBuffer(1, 0, VENTEA.math.mat4.scale(VENTEA.math.mat4.rotateX(VENTEA.math.mat4.identity(), -Math.PI / 2), [0.01, 0.01, 0.01]), 0, 16);
        //             passEncoder.setViewport(0, 0, _canvas.width, _canvas.height, 0, 1);
        //             passEncoder.setScissorRect(0, 0, _canvas.width, _canvas.height);
        //             if (lastMesh != mesh) {
        //                 pipeline.shader.writeUniformBuffer(0, 0, camera.viewMatrix, 0, 16);
        //                 pipeline.shader.writeUniformBuffer(0, 64, camera.projectionMatrix, 0, 16);

        //                 passEncoder.setVertexBuffer(0, (mesh.positionBuffer.as<WebGPUVertexBuffer>()).buffer);
        //                 passEncoder.setVertexBuffer(1, (mesh.normalBuffer.as<WebGPUVertexBuffer>()).buffer);
        //                 passEncoder.setVertexBuffer(2, (mesh.texCoordBuffer.as<WebGPUVertexBuffer>()).buffer);
        //                 passEncoder.setIndexBuffer((mesh.indexBuffer.as<WebGPUIndexBuffer>()).buffer, 'uint32');
        //                 passEncoder.setBindGroup(0, pipeline.shader.uniformBindGroup);
        //                 passEncoder.setBindGroup(1, pipeline.shader.transformBindGroup);
        //                 passEncoder.setPipeline(pipeline.pipeline);
        //             }

        //             lastMesh = mesh;

        //             for (const s of mesh.subMeshes) {
        //                 if (s.material?.bindGroup)
        //                     passEncoder.setBindGroup(2, s.material.bindGroup);

        //                 passEncoder.drawIndexed(s.indexCount, 1, s.baseIndex, s.baseVertex, i);
        //             }

        //             i++;
        //         }
        //     }
        // });

        _api.renderScene(scene, time, camera);
        // _api.renderScene(scene, time, camera, this.debugPipeline);

        this.endRenderPass();

        _tpsPanel.update(1000 / Physics.frameTime, 60);
    }

    static resize(width: number, height: number): void {
        _api.resize(width, height);
    }
}