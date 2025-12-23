import { mat4 } from "gl-matrix";
import { ICamera } from "../../Camera/ICamera";
import { Mesh } from "../../Mesh/Mesh";
import { Scene } from "../../Scene/Scene";
import { Pipeline } from "../Pipeline";
import { RendererAPI } from "../RendererAPI";
import { WebGLPipeline } from "./WebGLPipeline";
import { WebGLTexture2D } from "./WebGLTexture2D";
import { WebGLUniformBuffer } from "./WebGLUniformBuffer";
import { WebGLVertexBuffer } from "./WebGLVertexBuffer";
import { MeshData } from "../../Mesh/MeshData";
export declare class WebGLRendererAPI extends RendererAPI {
    static lightsBuffer: WebGLUniformBuffer;
    static transformBuffer: Float32Array;
    static transformVertexBuffer: WebGLVertexBuffer;
    static transformTexture: WebGLTexture2D;
    static skyboxPipeline: WebGLPipeline;
    static skyboxBuffer: MeshData;
    static create(canvas: HTMLCanvasElement): Promise<RendererAPI>;
    beginRenderPass(time: number, camera: ICamera): void;
    endRenderPass(scene: Scene): void;
    drawIndexed(size: number): void;
    submitStaticMesh(mesh: Mesh, transform: mat4): void;
    drawStaticMesh(mesh: Mesh, pipeline: Pipeline, transformOffset: number, instanceCount: number): void;
    renderScene(scene: Scene, time: number, camera: ICamera, pipe?: Pipeline): void;
    resize(width: number, height: number): void;
}
