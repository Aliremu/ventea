import { Texture2D } from "../Render/Texture2D";
import { UniformBuffer } from "../Render/UniformBuffer";
import { WebGPUContext } from "../Render/WebGPU/WebGPUContext";
import { WebGPUPipieline } from "../Render/WebGPU/WebGPUPipeline";
import { WebGPUTexture2D } from "../Render/WebGPU/WebGPUTexture2D";
import { Material } from "./Material";
import { Mesh } from "./Mesh";

export class SphereMesh extends Mesh {
    constructor(radius = 1.0) {
        let rings = 24;
        let sectors = rings * 2;

        let positions = new Float32Array(rings * sectors * 3);
        let normals = new Float32Array(rings * sectors * 3);
        let texCoords = new Float32Array(rings * sectors * 2);
        let indices = new Uint32Array((rings - 1) * (6 * (sectors - 1) + 6));

        const R = 1 / (rings - 1);
        const S = 1 / (sectors - 1);
        let r, s;

        let v_i = 0;
        let n_i = 0;
        let t_i = 0;
        for (r = 0; r < rings; r++) {
            for (s = 0; s < sectors; s++) {
                let y = Math.sin(-Math.PI / 2 + Math.PI * r * R);
                let x = Math.cos(2 * Math.PI * s * S) * Math.sin(Math.PI * r * R);
                let z = Math.sin(2 * Math.PI * s * S) * Math.sin(Math.PI * r * R);

                positions[v_i++] = x * radius;
                positions[v_i++] = y * radius;
                positions[v_i++] = z * radius;  

                normals[n_i++] = x;
                normals[n_i++] = y;
                normals[n_i++] = z; 

                texCoords[t_i++] = s * S;
                texCoords[t_i++] = r * R;
            }
        }

        let i_x = 0;
        let i_y = 0;
        for (r = 1; r < rings; r++) {
            for (s = 1; s < sectors; s++, i_y++) {
                // i[i_i++] = r * sectors + s;
                // i[i_i++] = r * sectors + (s + 1);
                // i[i_i++] = (r + 1) * sectors + (s + 1);
                // i[i_i++] = (r + 1) * sectors + s;

                indices[i_x] = i_y; i_x++;
                indices[i_x] = i_y + sectors; i_x++;
                indices[i_x] = i_y + 1; i_x++;
                // second half of QUAD
                indices[i_x] = i_y + sectors; i_x++;
                indices[i_x] = i_y + sectors + 1; i_x++;
                indices[i_x] = i_y + 1; i_x++;
            }

            indices[i_x] = i_y; i_x++;
            indices[i_x] = i_y + sectors; i_x++;
            indices[i_x] = i_y + 1 - sectors; i_x++;
            // second half of QUAD
            indices[i_x] = i_y + sectors; i_x++;
            indices[i_x] = i_y + 1; i_x++;
            indices[i_x] = i_y - sectors + 1; i_x++;
            i_y++;
        }

        console.log(indices);

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