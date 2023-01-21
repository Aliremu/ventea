import { Resource } from "../Resource";
import { IndexBuffer } from "../Render/IndexBuffer";
import { Material } from "./Material";
import { VertexBuffer } from "../Render/VertexBuffer";
import { Pipeline } from "../Render/Pipeline";
export interface SubMesh {
    indexCount: number;
    baseIndex: number;
    baseVertex: number;
    material?: Material;
    transform?: Float32Array;
}
export declare class Mesh extends Resource<Mesh> {
    positionBuffer: VertexBuffer;
    normalBuffer: VertexBuffer;
    texCoordBuffer: VertexBuffer;
    transformBuffer: VertexBuffer;
    indexBuffer: IndexBuffer;
    pipeline: Pipeline;
    subMeshes: Array<SubMesh>;
    constructor(positions: Float32Array, normals: Float32Array, texCoords: Float32Array, indices: Uint32Array);
    recalculateNormals(angle?: number): void;
}
