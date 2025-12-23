import { IRenderTarget } from "../RenderTarget";
import { SamplerFilter } from "../Sampler";
import { Texture2D } from "../Texture2D";
import { TextureFormat } from "../TextureFormat";
import { WebGLContext } from "./WebGLContext";
import { WebGLTexture2D } from "./WebGLTexture2D";

export class WebGLRenderTarget implements IRenderTarget {
    public colorAttachment: Texture2D;
    public frameBuffer: WebGLFramebuffer;

    constructor(public width: number, public height: number) {
        const gl = WebGLContext.gl;
        const fb = gl.createFramebuffer();

        if(!fb) {
            throw new Error("Couldn't create framebuffer");
        }

        gl.bindFramebuffer(gl.FRAMEBUFFER, fb);

        const color = new Texture2D(width, height, TextureFormat.BGRA8UNORM, { minFilter: SamplerFilter.Nearest, magFilter: SamplerFilter.Nearest, mip: true });
        
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, color.as<WebGLTexture2D>().texture, 0);

        const depthBuffer = gl.createRenderbuffer();
        gl.bindRenderbuffer(gl.RENDERBUFFER, depthBuffer);
        gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, width, height);
        gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, depthBuffer);
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);

        this.colorAttachment = color;
        this.frameBuffer = fb;
    }

    bind(): void {
        const gl = WebGLContext.gl;

        gl.bindFramebuffer(gl.FRAMEBUFFER, this.frameBuffer);
        gl.viewport(0, 0, this.width, this.height);
        
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    }

    unbind(): void {
        const gl = WebGLContext.gl;

        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    }

    readPixels(): Uint8Array {
        const gl = WebGLContext.gl;
        
        const data = new Uint8Array(this.width * this.height * 4);

        gl.bindFramebuffer(gl.FRAMEBUFFER, this.frameBuffer);
        gl.readBuffer(gl.FRONT);
        gl.readPixels(0, 0, this.width, this.height, gl.RGBA, gl.UNSIGNED_BYTE, data);

        return data;
    }
}