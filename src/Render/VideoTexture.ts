import { Resource } from "../Resource";
import { API, Renderer } from "./Renderer";
import { Texture2D } from "./Texture2D";
import { WebGLVideoTexture } from "./WebGL/WebGLVideoTexture";
import { WebGPUVideoTexture } from "./WebGPU/WebGPUVideoTexture";

export interface IVideoTexture {
    texture: Texture2D;

    play(): void;
    unmute(): void;
    updateTexture(): void;
}


export class VideoTexture extends Resource<VideoTexture> {
    private _impl: IVideoTexture;
    constructor(uri: string) {
        super();

        switch(Renderer.api) {
            case API.WebGL: 
                this._impl = new WebGLVideoTexture(uri);
                break;
            case API.WebGPU: 
                this._impl = new WebGPUVideoTexture(uri);
                break;
        }
    }

    getImpl(): IVideoTexture {
        return this._impl;
    }

    as<T>(): T {
        return this._impl as unknown as T;
    }

    play(): void {
        this._impl.play();
    }

    unmute(): void {
        this._impl.unmute();
    }

    updateTexture(): void {
        this._impl.updateTexture();
    }

    getTexture(): Texture2D {
        return this._impl.texture;
    }
}