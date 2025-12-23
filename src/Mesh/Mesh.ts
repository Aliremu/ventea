import { Resource } from "../Resource";
import { IndexBuffer } from "../Render/IndexBuffer";
import { Material } from "./Material";
import { VertexBuffer } from "../Render/VertexBuffer";
import { Pipeline, PipelineLayout, ShaderType } from "../Render/Pipeline";
import { Vector3 } from "../Math/Vector";
import { vec3 } from "gl-matrix";
import { API, Renderer } from "../Render/Renderer";
import { WebGLContext } from "../Render/WebGL/WebGLContext";
import { WebGLVertexBuffer } from "../Render/WebGL/WebGLVertexBuffer";
import { WebGLIndexBuffer } from "../Render/WebGL/WebGLIndexBuffer";
import { MeshData } from "./MeshData";

export interface SubMesh {
    indexCount: number;
    baseIndex: number;
    baseVertex: number;

    material?: Material;

    transform?: Float32Array;
}

export class Mesh extends Resource<Mesh> {
    public subMeshes: Array<SubMesh>;

    public vao: WebGLVertexArrayObject | undefined;

    // public transform?: Float32Array;

    constructor(public meshData: MeshData, public material?: Material) {
        super();

        this.subMeshes = [];
    }
}