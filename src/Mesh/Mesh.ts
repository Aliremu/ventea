import { Resource } from "../Resource";
import { IndexBuffer } from "../Render/IndexBuffer";
import { Material } from "./Material";
import { VertexBuffer } from "../Render/VertexBuffer";
import { Pipeline, PipelineLayout, ShaderType } from "../Render/Pipeline";
import hash from "object-hash";
import { Vector3 } from "../Math/Vector";
import { vec3 } from "gl-matrix";
import { PBRShaderMaterial } from "../Render/PBRShaderMaterial";
import { DebugShaderMaterial } from "../Render/DebugShaderMaterial";
import { PhongShaderMaterial } from "../Render/PhongShaderMaterial";

export interface SubMesh {
    indexCount: number;
    baseIndex: number;
    baseVertex: number;

    material?: Material;

    transform?: Float32Array;
}

export class Mesh extends Resource<Mesh> {
    public positionBuffer: VertexBuffer;
    public normalBuffer: VertexBuffer;
    public texCoordBuffer: VertexBuffer;
    public transformBuffer: VertexBuffer;

    public indexBuffer: IndexBuffer;
    public pipeline: Pipeline;
    public subMeshes: Array<SubMesh>;

    // public transform?: Float32Array;

    constructor(positions: Float32Array, normals: Float32Array, texCoords: Float32Array, indices: Uint32Array) {
        super();

        this.positionBuffer = new VertexBuffer(positions, positions.length);
        this.normalBuffer   = new VertexBuffer(normals, normals.length);
        this.texCoordBuffer = new VertexBuffer(texCoords, texCoords.length);
        this.indexBuffer    = new IndexBuffer(indices, indices.length);
        this.transformBuffer= new VertexBuffer(positions, positions.length);

        this.subMeshes = [];
        
        const layout: PipelineLayout = {
            layout: [
                { name: 'position',  type: ShaderType.Float3 },
                { name: 'normal',    type: ShaderType.Float3 },
                { name: 'tex_coord', type: ShaderType.Float2 },
            ],
            backfaceCull: true,
            depthTest: true,
            shader: new PhongShaderMaterial(),
            wireframe: false
        };

        this.pipeline = new Pipeline(layout);
    }

    recalculateNormals(angle: number = 1): void {
        const vertices: Float32Array = this.positionBuffer.data;
        const indices: Uint32Array = this.indexBuffer.data;
        const normals: Float32Array = new Float32Array(vertices.length);

        const v1 = new Vector3();
        const v2 = new Vector3();
        const v3 = new Vector3();
        const cross = new Vector3();

        for(let i = 0; i < indices.length; i += 3) {
            const i1 = 3 * indices[i];
            const i2 = 3 * indices[i + 1];
            const i3 = 3 * indices[i + 2];

            v1.x = vertices[i1];
            v1.y = vertices[i1 + 1];
            v1.z = vertices[i1 + 2]; 

            v2.x = vertices[i2];
            v2.y = vertices[i2 + 1];
            v2.z = vertices[i2 + 2]; 

            v3.x = vertices[i3];
            v3.y = vertices[i3 + 1];
            v3.z = vertices[i3 + 2]; 

            vec3.cross(cross.buffer, vec3.subtract(new Vector3().buffer, v2.buffer, v1.buffer), vec3.subtract(new Vector3().buffer, v3.buffer, v1.buffer));
            vec3.normalize(cross.buffer, cross.buffer);

            normals[i1]     += cross.x;
            normals[i1 + 1] += cross.y;
            normals[i1 + 2] += cross.z;

            normals[i2]     += cross.x;
            normals[i2 + 1] += cross.y;
            normals[i2 + 2] += cross.z;

            normals[i3]     += cross.x;
            normals[i3 + 1] += cross.y;
            normals[i3 + 2] += cross.z;
        }

        for(let i = 0; i < normals.length / 3; i++) {
            v1.x = normals[i * 3];
            v1.y = normals[i * 3 + 1];
            v1.z = normals[i * 3 + 2];

            vec3.normalize(v1.buffer, v1.buffer);

            normals[i * 3]     = v1.x;
            normals[i * 3 + 1] = v1.y;
            normals[i * 3 + 2] = v1.z;
        }

        this.normalBuffer.setData(normals);
    }
}