import { File } from "./File.js";

export class Shader {
    #program;
    #uniforms = {};

    constructor(vertSrc, fragSrc) {
        let vertShader = this.compileShader(vertSrc, gl.VERTEX_SHADER);
        let fragShader = this.compileShader(fragSrc, gl.FRAGMENT_SHADER);

        let program = gl.createProgram();

        gl.attachShader(program, vertShader);
        gl.attachShader(program, fragShader);

        gl.linkProgram(program);

        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
            console.error('ERROR linking program!', gl.getProgramInfoLog(program));
            return;
        }
        gl.validateProgram(program);
        if (!gl.getProgramParameter(program, gl.VALIDATE_STATUS)) {
            console.error('ERROR validating program!', gl.getProgramInfoLog(program));
            return;
        }

        gl.useProgram(program);

        this.#program = program;
    }

    bind() {
        gl.useProgram(this.#program);
    }

    addUniform(location) {
        this.#uniforms[location] = gl.getUniformLocation(this.#program, location);
    }

    addUniforms(uniforms = {}) {
        for(const [k, v] in uniforms) {
            addUniform(k);

            switch(v.length) {
                case 2: setVec2(k, v); break;
                case 3: setVec3(k, v); break;
                case 4: setVec4(k, v); break;
            }
        }
    }

    setVec2(location, value) {
        //this.bind();
        if (!(location in this.#uniforms)) {
            this.addUniform(location);
        }
        gl.uniform2fv(this.#uniforms[location], value);
    }

    setVec3(location, value) {
        //this.bind();
        if (!(location in this.#uniforms)) {
            this.addUniform(location);
        }
        gl.uniform3fv(this.#uniforms[location], value);
    }

    setMat4(location, value) {
        this.bind();
        if (!(location in this.#uniforms)) {
            this.addUniform(location);
        }
        gl.uniformMatrix4fv(this.#uniforms[location], gl.FALSE, value);
    }

    setFloat(location, value) {
        //this.bind();
        if (!(location in this.#uniforms)) {
            this.addUniform(location);
        }
        gl.uniform1f(this.#uniforms[location], value);
    }

    setInt(location, value) {
        //this.bind();
        if (!(location in this.#uniforms)) {
            this.addUniform(location);
        }
        gl.uniform1i(this.#uniforms[location], value);
    }

    compileShader(source, type) {
        let shader = gl.createShader(type);
        gl.shaderSource(shader, source);

        gl.compileShader(shader);
        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            console.error('ERROR compiling shader!', gl.getShaderInfoLog(shader));
            return;
        }

        return shader;
    }

    static async create(vertFile, fragFile) {
        let vertSrc = await File.load(vertFile);
        let fragSrc = await File.load(fragFile);

        return new Shader(vertSrc, fragSrc);
    }
}