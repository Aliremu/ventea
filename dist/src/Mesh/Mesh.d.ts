import { Resource } from "../Resource";
import { Material } from "./Material";
import { MeshData } from "./MeshData";
export interface SubMesh {
    indexCount: number;
    baseIndex: number;
    baseVertex: number;
    material?: Material;
    transform?: Float32Array;
}
export declare class Mesh extends Resource<Mesh> {
    meshData: MeshData;
    material?: Material | undefined;
    subMeshes: Array<SubMesh>;
    vao: WebGLVertexArrayObject | undefined;
    constructor(meshData: MeshData, material?: Material | undefined);
}
