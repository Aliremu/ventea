import { load } from '@loaders.gl/core';
import { GLTF, GLTFLoader, GLTFMaterial, GLTFScene } from '@loaders.gl/gltf';
import { DracoLoader } from '@loaders.gl/draco';
import { GLTFMesh } from './Mesh/GLTFMesh';
import { Resource } from './Resource';
import { Texture2D } from './Render/Texture2D';
import { TextureFormat } from './Render/TextureFormat';

export class Resources {
    public static resources: Map<number, Resource<unknown>> = new Map<number, Resource<unknown>>();

    static load<T>(type: T, uri: string): Promise<T> {
        if (type === GLTFMesh) {
            return new Promise((resolve, reject) => {
                return load(uri, GLTFLoader, { DracoLoader, decompress: true }).then((gltf: GLTF) => {
                    resolve(new GLTFMesh(gltf) as T);
                });
            });
        }

        if (type === Texture2D) {
            return new Promise(async (resolve, reject) => {
                const response = await fetch(uri);
                const blob = await response.blob();
                const image = await createImageBitmap(blob);

                const texture = new Texture2D(image.width, image.height, TextureFormat.BGRA8UNORM, true);
                texture.setData(image);

                resolve(texture as T);
            });
        }

        return null! as Promise<T>;
    }

    static get<T extends Resource<T>>(handle: number): T {
        if(!this.resources.has(handle)) {
            console.log(this.resources);
            throw new Error('Can not find resource by handle: ' + handle);
        }

        return this.resources.get(handle) as T;
    }

    static add<T>(handle: number, resource: Resource<T>) {
        this.resources.set(handle, resource as any);
        // const bytes = uuidParse(name) as Uint8Array;
        // const buffer = new Uint32Array(bytes.buffer);

        // this.uuidCache.set(buffer, name);
    }
}