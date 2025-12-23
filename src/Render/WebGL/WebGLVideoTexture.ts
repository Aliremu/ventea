import { SamplerFilter, Wrap } from "../Sampler";
import { Texture2D } from "../Texture2D";
import { TextureFormat } from "../TextureFormat";
import { IVideoTexture } from "../VideoTexture";
import { WebGLContext } from "./WebGLContext";
import { WebGLTexture2D } from "./WebGLTexture2D";

export class WebGLVideoTexture implements IVideoTexture {
    public texture: Texture2D;
    public width: number;
    public height: number;
    public video: HTMLVideoElement;
    public uri: string;
    public canPlay: boolean;

    constructor(uri: string) {
        this.uri = uri;
        this.canPlay = false;

        const video = document.createElement('video');
        video.src = uri;
        video.loop = true;
        video.volume = 0.1;
        video.playsInline = true;

        // video.autoplay = true;
        video.muted = true;

        this.video = video;
        this.video.onloadeddata = () => {
            this.width = this.video.videoWidth;
            this.height = this.video.videoHeight;
            this.texture.resize(this.width, this.height);
        }

        this.video.addEventListener("playing", () => {
            this.canPlay = true;
        }, true);

        this.width = 1;
        this.height = 1;

        this.texture = new Texture2D(this.width, this.height, TextureFormat.BGRA8UNORM, {
            wrapS: Wrap.Clamp,
            wrapT: Wrap.Clamp,
            minFilter: SamplerFilter.Linear,
            mip: false
        });
    }

    play(): void {
        this.video.play();
    }

    unmute(): void {
        this.video.muted = false;
    }

    updateTexture(): void {
        const gl = WebGLContext.gl;
        
        if (!this.canPlay) return;

        gl.bindTexture(gl.TEXTURE_2D, this.texture.as<WebGLTexture2D>().texture);
        
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, this.width, this.height, 0, gl.RGBA, gl.UNSIGNED_BYTE, this.video as unknown as TexImageSource);
    }
}