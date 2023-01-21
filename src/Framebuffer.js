import { Renderer } from "./Renderer.js";
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

    constructor(width, height, shadow = false, drawBuffer = true) {
        this.#width = width;
        this.#height = height;

        const aspect = width / height;

        const resource = {
            width: width,
            height: height,
            data: null
        };

        const fb = gl.createFramebuffer();
        gl.bindFramebuffer(gl.FRAMEBUFFER, fb);

        this.#frameBuffer = fb;

        if (shadow) {
            const depth = new Texture(resource, { wrap: gl.CLAMP_TO_EDGE, filter: gl.NEAREST, internalFormat: gl.DEPTH_COMPONENT24, format: gl.DEPTH_COMPONENT, type: gl.UNSIGNED_INT });
            gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.TEXTURE_2D, depth.handle, 0);

            const color = new Texture(resource, { wrap: gl.CLAMP_TO_EDGE, filter: gl.NEAREST, internalFormat: gl.R11F_G11F_B10F, format: gl.RGB, type: gl.UNSIGNED_INT_10F_11F_11F_REV });
            gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, color.handle, 0);

            if (!drawBuffer) {
                gl.drawBuffers([gl.NONE]);
                gl.readBuffer(gl.NONE);
            }
            gl.bindFramebuffer(gl.FRAMEBUFFER, null);

            this.colorTexture = color;
            this.depthTexture = depth;
            this.#colorBuffer = shadow;
            this.#depthBuffer = null;
        } else {
            const color = new Texture(resource, { wrap: gl.CLAMP_TO_EDGE, filter: gl.NEAREST, internalFormat: gl.R11F_G11F_B10F, format: gl.RGB, type: gl.UNSIGNED_INT_10F_11F_11F_REV });
            gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, color.handle, 0);

            const depthBuffer = gl.createRenderbuffer();
            gl.bindRenderbuffer(gl.RENDERBUFFER, depthBuffer);
            gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, width, height);
            gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, depthBuffer);
            gl.bindFramebuffer(gl.FRAMEBUFFER, null);

            this.colorTexture = color;
            this.depthTexture = null;
            this.#colorBuffer = shadow;
            this.#depthBuffer = depthBuffer;
        }
    }

    bind() {
        gl.bindFramebuffer(gl.FRAMEBUFFER, this.#frameBuffer);

        gl.viewport(0, 0, this.#width, this.#height);
        gl.clearColor(0.3, 0.56, 1.0, 1);

        let bit = gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT;

        gl.clear(bit);
    }

    unbind() {
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    }

    draw() {
        gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

        gl.clearColor(0.3, 0.56, 1.0, 1);

        let bit = gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT;

        gl.clear(bit);

        Renderer.drawQuad();
    }

    static async create() {

    }
}