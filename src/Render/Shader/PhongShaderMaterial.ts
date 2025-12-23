import { Vector3 } from "../../Math/Vector";
import { API, Renderer } from "../Renderer";
import { Shader } from "../Shader";
import { Texture2D } from "../Texture2D";

export class PhongShaderMaterial {
    public albedoTexture: Texture2D;
    public normalTexture: Texture2D;

    public baseColor: Vector3;
    public alpha: number;
    
    public shader: Shader;

    constructor() {
        this.shader = Shader.find('PBR');
        this.albedoTexture = Texture2D.DEFAULT_TEXTURE;
        this.normalTexture = Texture2D.NORMAL_TEXTURE;

        this.baseColor = new Vector3(1, 1, 1);
        this.alpha = 1.0;
    }
}