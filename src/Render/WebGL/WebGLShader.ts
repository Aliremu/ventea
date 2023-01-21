import { IShader } from "../Shader";
import src from "./default.glsl";
import { WebGLContext } from "./WebGLContext";
import { WebGLUniformBuffer } from "./WebGLUniformBuffer";

export class WebGLShader implements IShader {
    public vertex: Map<string, any>;
    public uniforms: Map<string, any>;
    public buffers: Map<string, WebGLUniformBuffer>;
    public program: WebGLProgram;

    constructor(public vertSrc: string, public fragSrc: string) {
        const regex = /\/\/Vertex(.*)\/\/Fragment(.*)/mgs.exec(src);

        if(!regex) throw Error("Shader is not valid!");

        this.vertex = new Map();
        this.buffers = new Map();
        
        const gl = WebGLContext.gl;

        // vertSrc = regex.at(1)!;
        // fragSrc = regex.at(2)!;

        const vertShader = this.compileShader(vertSrc, gl.VERTEX_SHADER);
        const fragShader = this.compileShader(fragSrc, gl.FRAGMENT_SHADER);

        const program = gl.createProgram();

        if (!program) {
            throw new Error('Failed to create program');
        }

        gl.attachShader(program, vertShader);
        gl.attachShader(program, fragShader);

        gl.linkProgram(program);

        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
            throw new Error('Failed while linking program ' + gl.getProgramInfoLog(program));
        }
        gl.validateProgram(program);
        if (!gl.getProgramParameter(program, gl.VALIDATE_STATUS)) {
            throw new Error('Failed while validating program ' + gl.getProgramInfoLog(program));
        }

        gl.useProgram(program);

        const numUniforms = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS);
        const indices = [...Array(numUniforms).keys()];
        const blockIndices = gl.getActiveUniforms(program, indices, gl.UNIFORM_BLOCK_INDEX);
        const offsets = gl.getActiveUniforms(program, indices, gl.UNIFORM_OFFSET);
        
        this.uniforms = new Map();

        for(let i = 0; i < numUniforms; i++) {
            const uniformInfo = gl.getActiveUniform(program, i);

            if(!uniformInfo) {
                continue;
            }

            if (uniformInfo.name.startsWith("gl_") || uniformInfo.name.startsWith("webgl_")) {
                continue;
            }

            let {name, type, size} = uniformInfo;

            if(size == 1) {
                let location = gl.getUniformLocation(program, name);

                if(location == null) {
                    const blockIndex = blockIndices[i];
                    const offset = offsets[i];

                    name = gl.getActiveUniformBlockName(program, blockIndex)!;
                    this.uniforms.set(name, { type: type, location: blockIndex });


                    console.log(gl.getUniformBlockIndex(program, "pbr_material"));
                } else {
                    this.uniforms.set(name, { type: type, location: location });
                    console.log(name, type, location);
                }
            } else {
                for(let j = 0; j < size; j++) {
                    name = name.slice(0, -3) + `[${j}]`;
                    const location = gl.getUniformLocation(program, name);

                    this.uniforms.set(name, { type: type, location: location });
                    console.log(name, type, location);
                }
            }
        }

        this.program = program;

        gl.deleteShader(vertShader);
        gl.deleteShader(fragShader);
    }

    setUniforms(uniforms: any = {}) {
        const gl = WebGLContext.gl;
        
        for(const key in uniforms) {
            const info = this.uniforms.get(key);
            const v = uniforms[key];

            if(typeof info === 'undefined') {
                //Logger.error('Unknown Uniform Name: ' + key);
                continue;
            }

            switch(info.type) {
                case gl.INT:
                    gl.uniform1i(info.location, v);
                    break;
                case gl.SAMPLER_2D:
                    gl.uniform1i(info.location, v);
                    break;
                case gl.FLOAT:
                    gl.uniform1f(info.location, v);
                    break;
                case gl.FLOAT_VEC2:
                    gl.uniform2fv(info.location, v);
                    break;
                case gl.FLOAT_VEC3:
                    gl.uniform3fv(info.location, v);
                    break;
                case gl.FLOAT_VEC4:
                    gl.uniform4fv(info.location, v);
                    break;
                case gl.FLOAT_MAT4:
                    gl.uniformMatrix4fv(info.location, false, v);
                    break;
                default:
                    //Logger.error('Unknown Uniform Type!');
            }
        }
    }

    compileShader(source: string, type: number) {
        const gl = WebGLContext.gl;

        let shader = gl.createShader(type);

        if (!shader) {
            throw new Error('ERROR compiling shader!');
        }

        gl.shaderSource(shader, source);

        gl.compileShader(shader);

        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            throw new Error('ERROR compiling shader! ' + gl.getShaderInfoLog(shader));
        }

        return shader;
    }
}