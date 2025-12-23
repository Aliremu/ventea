import { Utils } from "../../Math/Utils";
import { Vector3 } from "../../Math/Vector";
import { Material } from "../../Mesh/Material";
import { API, Renderer } from "../Renderer";
import { Shader } from "../Shader";
import { Texture2D } from "../Texture2D";
import { UniformBuffer } from "../UniformBuffer";

export interface PBRMaterialDesc {
    albedoTexture: Texture2D;
    normalTexture: Texture2D;
    metallicRoughnessTexture: Texture2D;

    baseColor: Vector3;
    metalnessFactor: number;
    roughnessFactor: number;
    alpha: number;
}

export class PBRShaderMaterial extends Material {
    public albedoTexture: Texture2D;
    public normalTexture: Texture2D;
    public metallicRoughnessTexture: Texture2D;

    public baseColor: Vector3;
    public metalnessFactor: number;
    public roughnessFactor: number;
    public alpha: number;

    private uniformBuffer: UniformBuffer;

    static DEFAULT: PBRShaderMaterial;

    constructor(desc?: Partial<PBRMaterialDesc>) {
        super(Shader.find('PBR'));

        const fullDesc = Utils.merge(desc, { 
            albedoTexture: Texture2D.DEFAULT_TEXTURE,
            normalTexture: Texture2D.DEFAULT_TEXTURE,
            metallicRoughnessTexture: Texture2D.DEFAULT_TEXTURE,
            baseColor: new Vector3(1, 1, 1),
            roughnessFactor: 0.0,
            metalnessFactor: 0.0,
            alpha: 1.0,
        });

        this.albedoTexture = fullDesc.albedoTexture;
        this.normalTexture = fullDesc.normalTexture;
        this.metallicRoughnessTexture = fullDesc.metallicRoughnessTexture;

        this.baseColor = fullDesc.baseColor;
        this.roughnessFactor = fullDesc.roughnessFactor;
        this.metalnessFactor = fullDesc.metalnessFactor;
        this.alpha = fullDesc.alpha;

        const uniformBuffer = new UniformBuffer(28);
        uniformBuffer.data.fill(0);
        uniformBuffer.data[0] = this.baseColor.x;
        uniformBuffer.data[1] = this.baseColor.y;
        uniformBuffer.data[2] = this.baseColor.z;
        uniformBuffer.data[3] = this.alpha;

        uniformBuffer.data[4] = this.metalnessFactor;
        uniformBuffer.data[5] = this.roughnessFactor;

        uniformBuffer.setData(0, uniformBuffer.data, 0, 7);

        this.uniformBuffer = uniformBuffer;

        this.set('pbr_material', uniformBuffer);
        this.set('albedoTexture', fullDesc.albedoTexture);
        this.set('normalTexture', fullDesc.normalTexture);
        this.set('ao_m_rTexture', fullDesc.metallicRoughnessTexture);
        this.set('occlusionTexture', Texture2D.NORMAL_TEXTURE);

        this.build();
    }

    setColor(color: number[] | Vector3) {
        if(color instanceof Vector3) {
            this.baseColor.x = color.x;
            this.baseColor.y = color.y;
            this.baseColor.z = color.z;
        } else {
            this.baseColor.x = color[0];
            this.baseColor.y = color[1];
            this.baseColor.z = color[2];
        }
    }

    setAlpha(alpha: number) {
        this.alpha = alpha;
    }

    setMetalness(metalness: number) {
        this.metalnessFactor = metalness;
    }

    setRoughness(roughness: number) {
        this.roughnessFactor = roughness;
    }

    update() {
        this.uniformBuffer.data[0] = this.baseColor.x;
        this.uniformBuffer.data[1] = this.baseColor.y;
        this.uniformBuffer.data[2] = this.baseColor.z;
        this.uniformBuffer.data[3] = this.alpha;

        this.uniformBuffer.data[4] = this.metalnessFactor;
        this.uniformBuffer.data[5] = this.roughnessFactor;

        this.uniformBuffer.setData(0, this.uniformBuffer.data, 0, 7);
        
        this.set('pbr_material', this.uniformBuffer);
        this.set('albedoTexture', this.albedoTexture);
        this.set('normalTexture', this.normalTexture);
        this.set('ao_m_rTexture', this.metallicRoughnessTexture);
        this.set('occlusionTexture', Texture2D.NORMAL_TEXTURE);

        this.build();
    }
}