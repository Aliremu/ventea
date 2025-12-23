import { Resource } from "../Resource";
import { IndexBuffer } from "../Render/IndexBuffer";
import { Material } from "./Material";
import { VertexBuffer } from "../Render/VertexBuffer";
export interface SubMesh {
    indexCount: number;
    baseIndex: number;
    baseVertex: number;
    material?: Material;
    transform?: Float32Array;
}
export declare class MeshData extends Resource<MeshData> {
    positions: Float32Array;
    normals: Float32Array | undefined;
    texCoords: Float32Array | undefined;
    indices: Uint32Array;
    positionBuffer: VertexBuffer;
    normalBuffer: VertexBuffer;
    texCoordBuffer: VertexBuffer;
    transformBuffer: VertexBuffer;
    indexBuffer: IndexBuffer;
    vao: WebGLVertexArrayObject | undefined;
    constructor(positions: Float32Array, normals: Float32Array | undefined, texCoords: Float32Array | undefined, indices: Uint32Array);
    recalculateNormals(angle?: number): void;
}
