import { API, Renderer } from "../Renderer";
import { Shader } from "../Shader";
import glPBR from "./glsl/default.glsl";
import gpuPBR from "./wgsl/default.wgsl";

import glPhong from "./glsl/phong.glsl";
import gpuPhong from "./wgsl/phong.wgsl";

import glSkybox from "./glsl/skybox.glsl";
// import gpuPhong from "./wgsl/phong.wgsl";

import glShadow from "./glsl/shadow.glsl";

export class ShaderLoader {
    static loadShaders() {
        switch(Renderer.api) {
            case API.WebGL: {
                this.loadFile('PBR', glPBR);
                this.loadFile('Phong', glPhong);
                this.loadFile('Skybox', glSkybox);
                this.loadFile('Shadow', glShadow);
                break;
            }

            case API.WebGPU: 
                this.loadFile('PBR', gpuPBR);
                this.loadFile('Phong', gpuPhong);
                break;
        }
    }

    static loadFile(name: string, src: string) {
        const regex = /\/\/Vertex(.*)\/\/Fragment(.*)/mgs.exec(src);

        if(!regex) throw Error("Shader is not valid!");

        new Shader(name, regex.at(1)!, regex.at(2)!);
    }
}