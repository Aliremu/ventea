import { Texture } from "./Texture.js";

export class Framebuffer {
    #frameBuffer;
    #colorBuffer;
    #depthBuffer;
    colorTexture;
    depthTexture;
    #width;
    #height;

    #vbo;
    #ibo;

    constructor(colorTexture, depthTexture, fb, cb, db, width, height) {
        this.colorTexture = colorTexture;
        this.depthTexture = depthTexture;

        this.#frameBuffer = fb;
        this.#colorBuffer = cb;
        this.#depthBuffer = db;

        this.#width = width;
        this.#height = height;

        let vertices = [
            0.0, 0.0,
            1.0, 0.0,
            1.0, 1.0,
            0.0, 1.0
        ];

        let indices = [
            0, 1, 2, 0, 2, 3
        ];

        let vbo = gl.createBuffer();
        let ibo = gl.createBuffer();

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
        gl.bindFramebuffer(gl.FRAMEBUFFER, this.#frameBuffer);

        gl.viewport(0, 0, this.#width, this.#height);
        gl.clearColor(195 / 255, 235 / 255, 255 / 255, 1.0);

        let bit = gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT;

        gl.clear(bit);
    }

    unbind() {
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    }

    draw() {
        gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

        gl.clearColor(1, 1, 1, 1);

        let bit = gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT;

        gl.clear(bit);

        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.#ibo);
        gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);
    }

    static cum(width, height, internalFormat, format, type) {
        const targetTexture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, targetTexture);
        const level = 0;
        const border = 0;
        const data = null;
        gl.texImage2D(gl.TEXTURE_2D, level, internalFormat,
            width, height, border,
            format, type, data);

        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

        return targetTexture;
    }

    static async create(width, height, shadow = false, drawBuffer = true) {
        const aspect = width / height;
        const targetTextureWidth = width;
        const targetTextureHeight = height;

        const fb = gl.createFramebuffer();
        gl.bindFramebuffer(gl.FRAMEBUFFER, fb);

        if (shadow) {
            const depth = Framebuffer.cum(targetTextureWidth, targetTextureHeight, gl.DEPTH_COMPONENT24, gl.DEPTH_COMPONENT, gl.UNSIGNED_INT);
            gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.TEXTURE_2D, depth, 0);

            const color = Framebuffer.cum(targetTextureWidth, targetTextureHeight, gl.R11F_G11F_B10F, gl.RGB, gl.UNSIGNED_INT_10F_11F_11F_REV);
            gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, color, 0);

            if(!drawBuffer) {
                gl.drawBuffers([gl.NONE]);
                gl.readBuffer(gl.NONE);
            }
            gl.bindFramebuffer(gl.FRAMEBUFFER, null);

            return new Framebuffer(new Texture(color), new Texture(depth), fb, shadow, null, width, height);
        } else {
            const color = Framebuffer.cum(targetTextureWidth, targetTextureHeight, gl.R11F_G11F_B10F, gl.RGB, gl.UNSIGNED_INT_10F_11F_11F_REV);
            gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, color, 0);

            const depthBuffer = gl.createRenderbuffer();
            gl.bindRenderbuffer(gl.RENDERBUFFER, depthBuffer);
            gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, targetTextureWidth, targetTextureHeight);
            gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, depthBuffer);
            gl.bindFramebuffer(gl.FRAMEBUFFER, null);

            return new Framebuffer(new Texture(color), null, fb, shadow, depthBuffer, width, height);
        }
    }
}