import { API, Renderer } from "./Renderer";
import { Shader } from "./Shader";
import WebGLSrc from "./WebGL/default.glsl";
import WebGPUSrc from "./WebGPU/default.wgsl";

export class PBRShaderMaterial extends Shader {
    constructor() {
        switch(Renderer.api) {
            case API.WebGL: {
                const regex = /\/\/Vertex(.*)\/\/Fragment(.*)/mgs.exec(WebGLSrc);

                if(!regex) throw Error("Shader is not valid!");

                super(regex.at(1)!, regex.at(2)!);
                break;
            }

            case API.WebGPU: 
                const regex = /\/\/Vertex(.*)\/\/Fragment(.*)/mgs.exec(WebGPUSrc);

                if(!regex) throw Error("Shader is not valid!");

                super(regex.at(1)!, regex.at(2)!);
                break;
        }
    }
}