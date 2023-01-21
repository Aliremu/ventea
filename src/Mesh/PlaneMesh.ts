import { Texture2D } from "../Render/Texture2D";
import { UniformBuffer } from "../Render/UniformBuffer";
import { WebGPUContext } from "../Render/WebGPU/WebGPUContext";
import { WebGPUPipieline } from "../Render/WebGPU/WebGPUPipeline";
import { WebGPUTexture2D } from "../Render/WebGPU/WebGPUTexture2D";
import { Material } from "./Material";
import { Mesh } from "./Mesh";

export class PlaneMesh extends Mesh {
    constructor(width = 1, height = 1, subX = 1, subY = 1) {
        const halfX = width / 2;
        const halfY = height / 2;

        let positions = new Float32Array((subX + 1) * (subY + 1) * 3);
        let normals = new Float32Array((subX + 1) * (subY + 1) * 3);
        let texCoords = new Float32Array((subX + 1) * (subY + 1) * 2);
        let indices = new Uint32Array((subX * subY * 6));

        const incX = width / subX;
        const incY = height / subY;

        let p = 0;

        for(let y = -halfY; y <= halfY; y += incY) {
            for(let x = -halfX; x <= halfX; x += incX) {
                positions[3*p] = x;
                positions[3*p+1] = y;
                positions[3*p+2] = 0;

                normals[3*p] = 0;
                normals[3*p+1] = 0;
                normals[3*p+2] = 1;

                texCoords[2*p] = (x + halfX) / (width);
                texCoords[2*p+1] = (height - (y + halfY)) / (height);

                p++;
            }
        }

        let index = 0;

        for (let z = 0; z < subY; z++) {
            for (let x = 0; x < subX; x++) {

                let row1 = z * (subX + 1);
                let row2 = (z + 1) * (subX + 1);

                indices[index++] = row1 + x;
                indices[index++] = row1 + x + 1;
                indices[index++] = row2 + x + 1;

                indices[index++] = row1 + x;
                indices[index++] = row2 + x + 1;
                indices[index++] = row2 + x;
            }
        }

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
        
        this.subMeshes.push({ baseIndex: 0, baseVertex: 0, indexCount: index, material: material });
    }
}