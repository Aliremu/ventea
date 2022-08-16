import { Shader } from "./Shader.js";

export class ShadowPass {
    width = 0;
    height = 0;
    cubemap = null;
    fbo = null;

    shader = null;

    static ENV_CUBE_LOOK_DIR = [
        [ 1.0,  0.0,  0.0],
        [-1.0,  0.0,  0.0],
        [ 0.0,  1.0,  0.0],
        [ 0.0, -1.0,  0.0],
        [ 0.0,  0.0,  1.0],
        [ 0.0,  0.0, -1.0]
    ];
    
    static ENV_CUBE_LOOK_UP = [
        [0.0, -1.0,  0.0],
        [0.0, -1.0,  0.0],
        [0.0,  0.0,  1.0],
        [0.0,  0.0, -1.0],
        [0.0, -1.0,  0.0],
        [0.0, -1.0,  0.0]
    ];

    constructor(size, cubemap, fbo) {
        this.width = size;
        this.height = size;
        this.fbo = fbo;
        this.cubemap = cubemap;
    }

    bind() {
        gl.bindFramebuffer(gl.FRAMEBUFFER, this.fbo);
    }

    unbind() {
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    }

    pass(shader, pos, side = 0) {
        let perspective = [];
        let view = [];
        let matrix = [];
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_CUBE_MAP_POSITIVE_X + side, glTextureCube, 0);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        mat4.perspective(perspective, glMatrix.toRadian(90), 1, 1.0, 25.0);
        mat4.lookAt(view, pos, vec3.add([], pos, ENV_CUBE_LOOK_DIR[side]), ENV_CUBE_LOOK_UP[side]);
        mat4.multiply(matrix, perspective, view);
        this.shader.bind();
        this.shader.setMat4('LightSpace', matrix);
    }

    bindTexture(location = 0) {
        gl.activeTexture(gl.TEXTURE0 + location);
        gl.bindTexture(gl.TEXTURE_2D, this.pong);
    }

    static createTexture(size) {
        const texture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_CUBE_MAP, texture);
        for(let i = 0; i < 6; i++) {
            gl.texImage2D(gl.TEXTURE_CUBE_MAP_POSITIVE_X + i, 0, gl.DEPTH_COMPONENT24, size, size, gl.FALSE, gl.DEPTH_COMPONENT, gl.UNSIGNED_INT, null);
        }
        gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_R, gl.CLAMP_TO_EDGE);

        return texture;
    }

    static async create(size) {
        const fb = gl.createFramebuffer();
        gl.bindFramebuffer(gl.FRAMEBUFFER, fb);

        const depth = ShadowPass.createTexture(size);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.TEXTURE_CUBE_MAP_POSITIVE_X, depth, 0);

        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, null, 0);

        gl.drawBuffers([gl.NONE]);
        gl.readBuffer(gl.NONE);

        gl.bindFramebuffer(gl.FRAMEBUFFER, null);

        let fbo = new ShadowPass(depth, size);
        let shader = await Shader.create('./assets/shader/shadow.vert', './assets/shader/shadow.frag');
        fbo.shader = shader;

        return fbo;
    }
}