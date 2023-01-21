import { Texture2D } from "../Texture2D";
import { IVideoTexture } from "../VideoTexture";
export declare class WebGLVideoTexture implements IVideoTexture {
    texture: Texture2D;
    width?: number;
    height?: number;
    video: HTMLVideoElement;
    uri: string;
    canPlay: boolean;
    constructor(uri: string);
    play(): void;
    unmute(): void;
    updateTexture(): void;
}
