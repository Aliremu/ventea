import { Mesh } from './Mesh/Mesh';
import { Texture2D } from './Render/Texture2D';
import { VideoTexture } from './Render/VideoTexture';
import { Resource } from './Resource';
import { Sampler } from './Render/Sampler';
export declare class Resources {
    static resources: Map<number, Resource<unknown>>;
    static loadGLTF(uri: string): Promise<Mesh>;
    static loadTexture(uri: string, options?: Partial<Sampler>): Promise<Texture2D>;
    static loadVideo(uri: string): Promise<VideoTexture>;
    static get<T extends Resource<T>>(handle: number): T;
    static has<T extends Resource<T>>(handle: number): boolean;
    static add<T>(handle: number, resource: Resource<T>): void;
}
