import { Shader } from "./Shader.js";

export class BlurPass {
    width = 0;
    height = 0;
    fbo = 0;
    ping = 0;
    pong = 0;

    #vbo = 0;
    #ibo = 0;

    shader = null;

    constructor(width, height, ping, pong, fbo) {
        this.width = width;
        this.height = height;
        this.ping = ping;
        this.pong = pong;
        this.fbo = fbo;

        const vertices = [
            0.0, 0.0,
            1.0, 0.0,
            1.0, 1.0,
            0.0, 1.0
        ];

        const indices = [
            0, 1, 2, 0, 2, 3
        ];

        const vbo = gl.createBuffer();
        const ibo = gl.createBuffer();

        gl.enableVertexAttribArray(0);
        gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
        gl.vertexAttribPointer(0, 2, gl.FLOAT, gl.FALSE, 0, 0);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
        gl.bindBuffer(gl.ARRAY_BUFFER, null);

        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibo);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);

        this.#vbo = vbo;
        this.#ibo = ibo;
    }

    bind() {
        gl.bindFramebuffer(gl.FRAMEBUFFER, this.fbo);
    }

    unbind() {
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    }

    drawBlurs() {
        this.shader.bind();
        this.shader.setVec2('u_Resolution', [this.width, this.height]);

        this.shader.setVec2('u_Direction', [1, 0]);
        gl.viewport(0, 0, this.width, this.height);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.ping, 0);

        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.#ibo);
        gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
//
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, this.ping);
        this.shader.setVec2('u_Direction', [-1, 0]);
        gl.viewport(0, 0, this.width, this.height);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.pong, 0);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.#ibo);
        gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
//
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, this.pong);
        this.shader.setVec2('u_Direction', [0, 1]);
        gl.viewport(0, 0, this.width, this.height);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.ping, 0);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.#ibo);
        gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
//
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, this.ping);
        this.shader.setVec2('u_Direction', [0, -1]);
        gl.viewport(0, 0, this.width, this.height);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.pong, 0);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.#ibo);
        gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
    }

    draw() {
        this.bind();

        this.drawBlurs();

        this.unbind();
        gl.viewport(0, 0, this.width, this.height);
    }

    bindTexture(location = 0) {
        gl.activeTexture(gl.TEXTURE0 + location);
        gl.bindTexture(gl.TEXTURE_2D, this.pong);
    }

    static createTexture(width, height) {
        const texture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.R11F_G11F_B10F, width, height, gl.FALSE, gl.RGB, gl.UNSIGNED_INT_10F_11F_11F_REV, null);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

        return texture;
    }

    static async create(width, height, levels) {
        const fb = gl.createFramebuffer();
        gl.bindFramebuffer(gl.FRAMEBUFFER, fb);

        let w = width;
        let h = height;

        const ping = BlurPass.createTexture(w, h);
        const pong = BlurPass.createTexture(w, h);

        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, ping, 0);
        gl.drawBuffers([gl.COLOR_ATTACHMENT0]);

        gl.bindFramebuffer(gl.FRAMEBUFFER, null);

        let fbo = new BlurPass(width, height, ping, pong, fb);
        let blur = await Shader.create('./assets/shader/blur.vert', './assets/shader/blur.frag');
        fbo.shader = blur;

        return fbo;
    }
}