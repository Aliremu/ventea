import { Material } from "./Material";
import { Mesh } from "./Mesh";
import { UniformBuffer } from "../Render/UniformBuffer";
import { WebGPUContext } from "../Render/WebGPU/WebGPUContext";
import { WebGPUTexture2D } from "../Render/WebGPU/WebGPUTexture2D";
import { WebGPUUniformBuffer } from "../Render/WebGPU/WebGPUUniformBuffer";
import { WebGPUPipieline } from "../Render/WebGPU/WebGPUPipeline";
import { Texture2D } from "../Render/Texture2D";
import { Vector3 } from "../Math/Vector";

export class BoxMesh extends Mesh {
    constructor(x: number | Vector3 = 1, y: number = 1, z: number = 1) {
        let halfX = 1 / 2;
        let halfY = 1 / 2;
        let halfZ = 1 / 2;

        if(x instanceof Vector3) {
            halfX = x.x / 2;
            halfY = x.y / 2;
            halfZ = x.z / 2;
        } else {
            halfX = x / 2;
            halfY = y / 2;
            halfZ = z / 2;
        }
        
        const positions = new Float32Array([
             // Front face
            -halfX, -halfY,  halfZ,
             halfX, -halfY,  halfZ,
             halfX,  halfY,  halfZ,
            -halfX,  halfY,  halfZ,

             // Back face
            -halfX, -halfY, -halfZ,
            -halfX,  halfY, -halfZ,
             halfX,  halfY, -halfZ,
             halfX, -halfY, -halfZ,

             // Top face
            -halfX,  halfY, -halfZ,
            -halfX,  halfY,  halfZ,
             halfX,  halfY,  halfZ,
             halfX,  halfY, -halfZ,

             // Bottom face
            -halfX, -halfY, -halfZ,
             halfX, -halfY, -halfZ,
             halfX, -halfY,  halfZ,
            -halfX, -halfY,  halfZ,

             // Right face
             halfX, -halfY, -halfZ,
             halfX,  halfY, -halfZ,
             halfX,  halfY,  halfZ,
             halfX, -halfY,  halfZ,

             // Left face
            -halfX, -halfY, -halfZ,
            -halfX, -halfY,  halfZ,
            -halfX,  halfY,  halfZ,
            -halfX,  halfY, -halfZ,
        ]);

        const normals = new Float32Array([
            0.0, 0.0, 1.0,
            0.0, 0.0, 1.0,
            0.0, 0.0, 1.0,
            0.0, 0.0, 1.0,

            0.0, 0.0, -1.0,
            0.0, 0.0, -1.0,
            0.0, 0.0, -1.0,
            0.0, 0.0, -1.0,

            0.0, 1.0, 0.0,
            0.0, 1.0, 0.0,
            0.0, 1.0, 0.0,
            0.0, 1.0, 0.0,

            0.0, -1.0, 0.0,
            0.0, -1.0, 0.0,
            0.0, -1.0, 0.0,
            0.0, -1.0, 0.0,

            1.0, 0.0, 0.0,
            1.0, 0.0, 0.0,
            1.0, 0.0, 0.0,
            1.0, 0.0, 0.0,

            -1.0, 0.0, 0.0,
            -1.0, 0.0, 0.0,
            -1.0, 0.0, 0.0,
            -1.0, 0.0, 0.0,
        ]);

        const texCoords = new Float32Array([
            0, 0,
            1, 0,
            1, 1,
            0, 1,

            0, 0,
            1, 0,
            1, 1,
            0, 1,

            0, 0,
            1, 0,
            1, 1,
            0, 1,

            0, 0,
            1, 0,
            1, 1,
            0, 1,

            0, 0,
            1, 0,
            1, 1,
            0, 1,

            0, 0,
            1, 0,
            1, 1,
            0, 1
        ]);

        const indices = new Uint32Array([
            0, 1, 2, 0, 2, 3,    // front
            4, 5, 6, 4, 6, 7,    // back
            8, 9, 10, 8, 10, 11,   // top
            12, 13, 14, 12, 14, 15,   // bottom
            16, 17, 18, 16, 18, 19,   // right
            20, 21, 22, 20, 22, 23,   // left
        ]);

        super(positions, normals, texCoords, indices);

        const buffer = new UniformBuffer(28);
        buffer.data.fill(0);
        buffer.data[0] = 1;
        buffer.data[1] = 1;
        buffer.data[2] = 1;
        buffer.data[3] = 1;

        buffer.setData(0, buffer.data, 0, 7);

        const material = new Material();
        material.pipeline = this.pipeline;

        material.set('pbr_material', buffer);
        material.set('albedoTexture', Texture2D.DEFAULT_TEXTURE);
        material.set('normalTexture', Texture2D.NORMAL_TEXTURE);
        material.set('ao_m_rTexture', Texture2D.NORMAL_TEXTURE);
        material.set('occlusionTexture', Texture2D.NORMAL_TEXTURE);

        material.build();
        
        this.subMeshes.push({ baseIndex: 0, baseVertex: 0, indexCount: indices.length, material: material });
    }
}