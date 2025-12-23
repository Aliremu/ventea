import { Resource } from "../Resource";
import { IndexBuffer } from "../Render/IndexBuffer";
import { Material } from "./Material";
import { VertexBuffer } from "../Render/VertexBuffer";
import { Pipeline, PipelineLayout, ShaderType } from "../Render/Pipeline";
import hash from "object-hash";
import { Vector3 } from "../Math/Vector";
import { vec3 } from "gl-matrix";
import { PBRShaderMaterial } from "../Render/Shader/PBRShaderMaterial";
import { DebugShaderMaterial } from "../Render/Shader/DebugShaderMaterial";
import { PhongShaderMaterial } from "../Render/Shader/PhongShaderMaterial";
import { Shader } from "../Render/Shader";
import { API, Renderer } from "../Render/Renderer";
import { WebGLContext } from "../Render/WebGL/WebGLContext";
import { WebGLVertexBuffer } from "../Render/WebGL/WebGLVertexBuffer";
import { WebGLIndexBuffer } from "../Render/WebGL/WebGLIndexBuffer";

export interface SubMesh {
    indexCount: number;
    baseIndex: number;
    baseVertex: number;

    material?: Material;

    transform?: Float32Array;
}

export class MeshData extends Resource<MeshData> {
    public positionBuffer: VertexBuffer;
    public normalBuffer: VertexBuffer;
    public texCoordBuffer: VertexBuffer;
    public transformBuffer: VertexBuffer;

    public indexBuffer: IndexBuffer;

    public vao: WebGLVertexArrayObject | undefined;

    // public transform?: Float32Array;

    constructor(public positions: Float32Array, public normals: Float32Array | undefined, public texCoords: Float32Array | undefined, public indices: Uint32Array) {
        super(); 

        if(!this.normals) {
            this.normals = new Float32Array(positions.length);
        }

        if(!this.texCoords) {
            this.texCoords = new Float32Array(positions.length / 3 * 2);
        }

        this.positionBuffer = new VertexBuffer(this.positions, this.positions.length);
        this.normalBuffer   = new VertexBuffer(this.normals, this.normals.length);
        this.texCoordBuffer = new VertexBuffer(this.texCoords, this.texCoords.length);
        this.indexBuffer    = new IndexBuffer(this.indices, this.indices.length);
        this.transformBuffer= new VertexBuffer(this.positions, this.positions.length);

        if(Renderer.api == API.WebGL) {
            const gl = WebGLContext.gl;
            
            this.vao = gl.createVertexArray()!;

            gl.bindVertexArray(this.vao);
            gl.enableVertexAttribArray(0);
            gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer.as<WebGLVertexBuffer>().buffer);
            gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 0, 0);

            gl.enableVertexAttribArray(1);
            gl.bindBuffer(gl.ARRAY_BUFFER, this.normalBuffer.as<WebGLVertexBuffer>().buffer);
            gl.vertexAttribPointer(1, 3, gl.FLOAT, false, 0, 0);

            gl.enableVertexAttribArray(2);
            gl.bindBuffer(gl.ARRAY_BUFFER, this.texCoordBuffer.as<WebGLVertexBuffer>().buffer);
            gl.vertexAttribPointer(2, 2, gl.FLOAT, false, 0, 0);

            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer.as<WebGLIndexBuffer>().buffer);
            gl.bindVertexArray(null);
        }
    }

    recalculateNormals(angle: number = 1): void {
        const vertices: Float32Array = this.positions;
        const indices: Uint32Array = this.indices;
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

        this.normals = normals;
        this.normalBuffer.setData(this.normals);
    }
}