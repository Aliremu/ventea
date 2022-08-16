import { Shader } from "./Shader.js";
import { BlurPass } from "./BlurPass.js";
import { Renderer } from "./Renderer.js";

export class BloomPass {
    width = 0;
    height = 0;
    fbo = 0;
    mips = [];

    #vbo = 0;
    #ibo = 0;

    shader = null;
    blurPass = null;

    constructor(width, height, fbo, mips) {
        this.width = width;
        this.height = height;
        this.fbo = fbo;
        this.mips = mips;
    }

    bind() {
        gl.bindFramebuffer(gl.FRAMEBUFFER, this.fbo);
    }

    unbind() {
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    }

    drawDownsamples() {
        for (const mip of this.mips) {
            this.shader.bind();
            this.shader.setVec2('u_Resolution', [this.width, this.height]);
            this.shader.setInt('u_Stage', 2);
            this.bind();
            gl.viewport(0, 0, mip.isize[0], mip.isize[1]);
            gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, mip.texture, 0);

            Renderer.drawQuad();

            this.shader.setVec2("u_Resolution", mip.size);

            gl.bindTexture(gl.TEXTURE_2D, mip.texture);

            this.blurPass.bind();
            this.blurPass.draw();
            this.blurPass.unbind();
            this.blurPass.bindTexture();
        }
    }

    drawUpsamples() {
        this.bind();
        this.shader.bind();
        this.shader.setFloat('u_FilterRadius', 0.005);
        this.shader.setInt('u_Stage', 3);

        gl.enable(gl.BLEND);
        gl.blendFunc(gl.ONE, gl.ONE);
        gl.blendEquation(gl.FUNC_ADD);

        for (let i = this.mips.length - 1; i > 0; i--) {
            const mip = this.mips[i];
            const nextMip = this.mips[i - 1];

            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_2D, mip.texture);

            //gl.activeTexture(gl.TEXTURE0 + 1);
            //gl.bindTexture(gl.TEXTURE_2D, mip.texture);

            gl.viewport(0, 0, nextMip.isize[0], nextMip.isize[1]);
            gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, nextMip.texture, 0);

            Renderer.drawQuad();
        }

        gl.disable(gl.BLEND);
    }

    drawPrefilter() {
        this.shader.bind();
        this.shader.setVec2('u_Resolution', [this.width, this.height]);
        this.shader.setInt('u_Stage', 1);

        const mip = this.mips[0];

        gl.viewport(0, 0, mip.isize[0], mip.isize[1]);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, mip.texture, 0);

        Renderer.drawQuad();
    }

    draw() {
        this.bind();

        //this.drawPrefilter();
        this.drawDownsamples();
        this.drawUpsamples();

        this.unbind();
        gl.viewport(0, 0, this.width, this.height);
    }

    bindBloom(location = 0) {
        gl.activeTexture(gl.TEXTURE0 + location);
        gl.bindTexture(gl.TEXTURE_2D, this.mips[0].texture);
    }

    static createMip(width, height) {
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
        let mips = [];

        let w = width;
        let h = height;

        for (let i = 0; i < levels; i++) {
            const texture = BloomPass.createMip(Math.floor(w), Math.floor(h));
            mips.push({
                texture: texture,
                isize: [Math.floor(w), Math.floor(h)],
                size: [w, h]
            });

            w /= 2;
            h /= 2;
        }
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, mips[0].texture, 0);
        gl.drawBuffers([gl.COLOR_ATTACHMENT0]);

        //const depthBuffer = gl.createRenderbuffer();
        //gl.bindRenderbuffer(gl.RENDERBUFFER, depthBuffer);
        //gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, width, height);
        //gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, depthBuffer);

        console.log(gl.checkFramebufferStatus(gl.FRAMEBUFFER));

        gl.bindFramebuffer(gl.FRAMEBUFFER, null);

        let fbo = new BloomPass(width, height, fb, mips);
        let bloom = await Shader.create('./assets/shader/bloom.vert', './assets/shader/bloom.frag');
        bloom.setInt('u_Mip', 0);
        bloom.setInt('u_PrevMip', 1);

        fbo.shader = bloom;

        let blur = await BlurPass.create(window.innerWidth, window.innerHeight);
        fbo.blurPass = blur;

        return fbo;
    }
}