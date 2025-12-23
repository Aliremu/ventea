import { Vector3 } from "../../Math/Vector";
import { Shader } from "../Shader";
import { Texture2D } from "../Texture2D";
export declare class PhongShaderMaterial {
    albedoTexture: Texture2D;
    normalTexture: Texture2D;
    baseColor: Vector3;
    alpha: number;
    shader: Shader;
    constructor();
}
