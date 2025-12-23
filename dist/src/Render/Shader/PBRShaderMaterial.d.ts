import { Vector3 } from "../../Math/Vector";
import { Material } from "../../Mesh/Material";
import { Texture2D } from "../Texture2D";
export interface PBRMaterialDesc {
    albedoTexture: Texture2D;
    normalTexture: Texture2D;
    metallicRoughnessTexture: Texture2D;
    baseColor: Vector3;
    metalnessFactor: number;
    roughnessFactor: number;
    alpha: number;
}
export declare class PBRShaderMaterial extends Material {
    albedoTexture: Texture2D;
    normalTexture: Texture2D;
    metallicRoughnessTexture: Texture2D;
    baseColor: Vector3;
    metalnessFactor: number;
    roughnessFactor: number;
    alpha: number;
    private uniformBuffer;
    static DEFAULT: PBRShaderMaterial;
    constructor(desc?: Partial<PBRMaterialDesc>);
    setColor(color: number[] | Vector3): void;
    setAlpha(alpha: number): void;
    setMetalness(metalness: number): void;
    setRoughness(roughness: number): void;
    update(): void;
}
