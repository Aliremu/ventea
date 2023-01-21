import { DebugShaderMaterial } from "../Render/DebugShaderMaterial";
import { Pipeline, PipelineLayout, ShaderType } from "../Render/Pipeline";
import { Texture2D } from "../Render/Texture2D";
import { UniformBuffer } from "../Render/UniformBuffer";
import { WebGPUContext } from "../Render/WebGPU/WebGPUContext";
import { WebGPUPipieline } from "../Render/WebGPU/WebGPUPipeline";
import { WebGPUTexture2D } from "../Render/WebGPU/WebGPUTexture2D";
import { Material } from "./Material";
import { Mesh } from "./Mesh";

export class GridMesh extends Mesh {
    constructor(width: number, height: number) {
        let positions: Float32Array = new Float32Array(2 * (width + 1 + height + 1) * 3);
        let normals: Float32Array   = new Float32Array(2 * (width + 1 + height + 1) * 3).fill(0);
        let texCoords: Float32Array = new Float32Array(2 * (width + 1 + height + 1) * 2).fill(0);
        let indices = new Uint32Array(2 * (width + 1 + height + 1));

        let offset = 0;
        let index = 0;

        for(let x = 0; x < width + 1; x++) {
            indices[index] = index++;

            positions[offset++] = (x / (width + 1)) * width - width / 2;
            normals[offset] = 1;
            positions[offset++] = 0;
            positions[offset++] = -height / 2;

            indices[index] = index++;
            
            positions[offset++] = (x / (width + 1)) * width - width / 2;
            normals[offset] = 1;
            positions[offset++] = 0;
            positions[offset++] = height / 2 - (height / (height + 1));
        }

        for(let y = 0; y < height + 1; y++) {
            indices[index] = index++;
            
            positions[offset++] = -width / 2;
            normals[offset] = 1;
            positions[offset++] = 0;
            positions[offset++] = (y / (height + 1)) * height - height / 2;

            indices[index] = index++;
            
            positions[offset++] = width / 2 - (width / (width + 1));
            normals[offset] = 1;
            positions[offset++] = 0;
            positions[offset++] = (y / (height + 1)) * height - height / 2;
        }

        super(positions, normals, texCoords, indices);

        const layout: PipelineLayout = {
            layout: [
                { name: 'position',  type: ShaderType.Float3 },
                { name: 'normal',    type: ShaderType.Float3 },
                { name: 'tex_coord', type: ShaderType.Float2 },
            ],
            backfaceCull: true,
            depthTest: true,
            shader: new DebugShaderMaterial(),
            wireframe: true
        };

        this.pipeline = new Pipeline(layout);

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