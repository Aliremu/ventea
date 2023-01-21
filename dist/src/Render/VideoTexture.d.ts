import { Resource } from "../Resource";
import { Texture2D } from "./Texture2D";
export interface IVideoTexture {
    texture: Texture2D;
    play(): void;
    unmute(): void;
    updateTexture(): void;
}
export declare class VideoTexture extends Resource<VideoTexture> {
    private _impl;
    constructor(uri: string);
    getImpl(): IVideoTexture;
    as<T>(): T;
    play(): void;
    unmute(): void;
    updateTexture(): void;
    getTexture(): Texture2D;
}
