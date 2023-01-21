import { Texture2D } from "../Texture2D";
import { IVideoTexture } from "../VideoTexture";
import { WebGPUContext } from "./WebGPUContext";
import { WebGPUTexture2D } from "./WebGPUTexture2D";

export class WebGPUVideoTexture implements IVideoTexture {
    public texture!: Texture2D;
    public width?: number;
    public height?: number;
    public video: HTMLVideoElement;
    public uri: string;

    constructor(uri: string) {
        this.uri = uri;

        const video = document.createElement('video');
        video.src = uri;
        video.loop = true;
        video.volume = 0.1;

        video.autoplay = true;
        video.muted = true;

        this.video = video;
        this.video.onloadedmetadata = () => {
            this.width = this.video.videoWidth;
            this.height = this.video.videoHeight;
            this.texture = new Texture2D(this.width, this.height);
        }

        this.texture = new Texture2D(1, 1);
    }

    play(): void {
        this.video?.play();
    }

    unmute(): void {
        this.video.muted = false;
    }

    updateTexture(): void {
        // console.log(this.texture?.texture!);
        // const ext = WebGPUContext.device.importExternalTexture({ source: this.video });
        // WebGPUContext.queue.copyExternalImageToTexture({ source: this.video }, { texture: this.texture?.as<WebGPUTexture2D>().texture! }, [this.width!, this.height!]);
        this.texture.as<WebGPUTexture2D>().setData(this.video);
    }
}