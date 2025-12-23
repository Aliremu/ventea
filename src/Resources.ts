import { load } from '@loaders.gl/core';
import { DracoLoader } from '@loaders.gl/draco';
import { GLTF, GLTFLoader, GLTFMaterial, GLTFScene } from '@loaders.gl/gltf';
import { mat4, vec3 } from 'gl-matrix';
import { Vector3 } from './Math/Vector';
import { Material } from './Mesh/Material';
import { Mesh, SubMesh } from './Mesh/Mesh';
import { MeshData } from './Mesh/MeshData';
import { Renderer } from './Render/Renderer';
import { PBRShaderMaterial } from './Render/Shader/PBRShaderMaterial';
import { Texture2D } from './Render/Texture2D';
import { TextureFormat } from './Render/TextureFormat';
import { UniformBuffer } from './Render/UniformBuffer';
import { VideoTexture } from './Render/VideoTexture';
import { Resource } from './Resource';
import { Sampler, SamplerFilter, Wrap } from './Render/Sampler';
import { Utils } from './Math/Utils';

function loadGLTF(gltf: GLTF) {
    const bakeTransforms = (buffer: Float32Array, transform: Float32Array) => {
        const size = buffer.length;
        const vec = new Vector3();

        for (let i = 0; i < size / 3; i++) {
            vec.x = buffer[i * 3];
            vec.y = buffer[i * 3 + 1];
            vec.z = buffer[i * 3 + 2];

            vec3.transformMat4(vec.buffer, vec.buffer, transform);

            buffer[i * 3] = vec.x;
            buffer[i * 3 + 1] = vec.y;
            buffer[i * 3 + 2] = vec.z;
        }
    }

    const traverseNode = (node: any, transform: mat4, out: Map<string, any>) => {
        let t = mat4.create();
        if ('matrix' in node) {
            t = node.matrix;
        } else {
            mat4.fromRotationTranslationScale(t, node.rotation ?? [0, 0, 0, 1], node.translation ?? [0, 0, 0], node.scale ?? [1, 1, 1]);
        }
        const copy = mat4.create();

        mat4.multiply(copy, transform, t);

        if ('mesh' in node) {
            if (!out.has(node.id)) {
                out.set(node.id, { mesh: node.mesh, transform: copy });
                return;
            }
        }

        if ('children' in node) {
            for (const child of node.children) {
                traverseNode(child, copy, out);
            }
        }
    }

    console.log(gltf);

    const scene = gltf.scene as GLTFScene;
    // console.log(gltf);
    console.log((gltf.scene as GLTFScene).nodes);

    //const images = await asset.imageData.preFetchAll();

    const images = gltf.images!;

    console.log(images);

    let materials = [];

    let positionsList: Float32Array[] = [];
    let normalsList: Float32Array[] = [];
    let texCoordsList: Float32Array[] = [];
    let indicesList: Uint32Array[] = [];

    let subMeshes = [];

    let baseVertex = 0;
    let baseIndex = 0;


    // TODO: Could probably optimize with DP
    const t = mat4.create();
    mat4.identity(t);

    const test: Map<string, any> = new Map<string, any>();
    traverseNode({ children: (gltf.scene as any).nodes }, t, test);

    console.log(test);

    // for (const mesh of gltf.meshes!) {
    for (const [key, value] of test) {
        const mesh = value.mesh;
        const transform = value.transform;

        for (let primitive of mesh.primitives) {
            //console.log(primitive);

            let vertexCount = 0;

            if ('POSITION' in primitive.attributes) {
                //const positions = getAccessor(asset, primitive.attributes.POSITION, Type.FLOAT) as Float32Array;
                const positions = (primitive.attributes.POSITION as any).value as Float32Array;
                bakeTransforms(positions, transform);

                positionsList.push(positions);
                vertexCount = positions.length / 3;
            }

            if ('NORMAL' in primitive.attributes) {
                // const normals = getAccessor(asset, primitive.attributes.NORMAL, Type.FLOAT) as Float32Array;
                const test = mat4.create();
                //fromRotationTranslationScale(test, node.rotation ?? [0, 0, 0, 1], [0, 0, 0], [1, 1, 1]);

                const normals = (primitive.attributes.NORMAL as any).value as Float32Array;
                const ahhh = mat4.clone(transform);
                ahhh[3] = 0;
                ahhh[7] = 0;
                ahhh[11] = 0;

                ahhh[12] = 0;
                ahhh[13] = 0;
                ahhh[14] = 0;
                ahhh[15] = 1;

                mat4.invert(ahhh, ahhh);
                mat4.transpose(ahhh, ahhh);

                //TODO
                bakeTransforms(normals, ahhh as Float32Array);
                normalsList.push(normals);
            }

            if ('TEXCOORD_0' in primitive.attributes) {
                // const texCoords = getAccessor(asset, primitive.attributes.TEXCOORD_0, Type.FLOAT) as Float32Array;
                const texCoords = (primitive.attributes.TEXCOORD_0 as any).value as Float32Array;
                texCoordsList.push(texCoords);
            } else {
                texCoordsList.push(new Float32Array(vertexCount * 2).fill(0));
            }

            // const indices = getAccessor(asset, primitive.indices!, Type.UINT) as Uint32Array;
            // const indices = new Uint32Array((primitive.indices as any).value);
            const indices = (primitive.indices as any).value as Uint32Array;
            //console.log(indices);
            indicesList.push(indices);

            let descriptor = [];

            const mat: GLTFMaterial = primitive.material as GLTFMaterial;

            const material = new PBRShaderMaterial();

            // console.log(mat);

            if (mat?.pbrMetallicRoughness?.baseColorTexture) {
                const image = (mat.pbrMetallicRoughness.baseColorTexture as any).texture.source.image;
                // console.log(image);
                // const t = new WebGPUTexture(image.width, image.height, image);
                const texture = new Texture2D(image.width, image.height, TextureFormat.BGRA8UNORM, {
                    mip: true
                });
                texture.setData(image);
                material.albedoTexture = texture;
            } else {
                if (mat?.extensions?.KHR_materials_pbrSpecularGlossiness) {
                    const diffuse = (images[mat.extensions.KHR_materials_pbrSpecularGlossiness.diffuseTexture.index] as any).image;
                    const texture = new Texture2D(diffuse.width, diffuse.height, TextureFormat.BGRA8UNORM, {
                        mip: true
                    });

                    texture.setData(diffuse);
                    material.albedoTexture = texture;
                }
            }

            if (mat?.pbrMetallicRoughness?.metallicRoughnessTexture) {
                const image = (mat.pbrMetallicRoughness.metallicRoughnessTexture as any).texture.source.image;

                const texture = new Texture2D(image.width, image.height, TextureFormat.BGRA8UNORM, {
                    mip: true
                });
                texture.setData(image);
                material.metallicRoughnessTexture = texture;
            }

            if (mat?.pbrMetallicRoughness?.baseColorFactor) {
                const color = mat?.pbrMetallicRoughness?.baseColorFactor;
                
                material.setColor(color);
                material.setAlpha(color[3]);
            }

            if (mat?.pbrMetallicRoughness?.roughnessFactor) {
                const roughness = mat?.pbrMetallicRoughness?.roughnessFactor;
                
                material.setRoughness(roughness);
            }

            if (mat?.pbrMetallicRoughness?.metallicFactor) {
                const metalness = mat?.pbrMetallicRoughness?.metallicFactor;
                
                material.setMetalness(metalness);
            }

            if (mat?.normalTexture) {
                const image = (mat.normalTexture as any).texture.source.image;

                const texture = new Texture2D(image.width, image.height, TextureFormat.BGRA8UNORM, {
                    mip: true
                });
                texture.setData(image);
                material.normalTexture = texture;
            }

            if (mat?.occlusionTexture) {
                const image = (mat.occlusionTexture as any).texture.source.image;

                const texture = new Texture2D(image.width, image.height, TextureFormat.BGRA8UNORM, {
                    mip: true
                });
                texture.setData(image);
                material.set('occlusionTexture', texture);
            }

            material.update();

            const subMesh: SubMesh = {
                indexCount: indices.length,
                baseVertex: baseVertex,
                baseIndex: baseIndex,
                material: material,
                transform: transform
            };

            //console.log([primitive.material!]);

            baseVertex += vertexCount;
            baseIndex += indices.length;

            //if(subMesh.material?.descriptor.length == 2) continue;

            subMeshes.push(subMesh);
        }        
    }

    let positions = new Float32Array(baseVertex * 3);
    let normals = new Float32Array(baseVertex * 3);
    let texCoords = new Float32Array(baseVertex * 2);

    let indices = new Uint32Array(baseIndex);

    let pCount = 0;
    let nCount = 0;
    let tCount = 0;
    let iCount = 0;

    for (let i = 0; i < positionsList.length; i++) {
        const position = positionsList[i];
        let normal = normalsList[i];
        const texCoord = texCoordsList[i];

        for (const n of position) {
            positions[pCount++] = n;
        }

        // if(typeof normal === 'undefined')
        //     normal = new Float32Array(position.length).fill(0);

        for (const n of normal) {
            normals[nCount++] = n;
        }

        for (const n of texCoord) {
            texCoords[tCount++] = n;
        }
    }


    for (const index of indicesList) {
        for (const n of index) {
            indices[iCount++] = n;
        }
    }

    const meshData = new MeshData(positions, normals, texCoords, indices);
    const mesh = new Mesh(meshData);

    mesh.subMeshes = subMeshes;

    return mesh;
}

export class Resources {
    public static resources: Map<number, Resource<unknown>> = new Map<number, Resource<unknown>>();

    static loadGLTF(uri: string): Promise<Mesh> {
        return new Promise((resolve, reject) => {
            return load(uri, GLTFLoader, { DracoLoader, decompress: true }).then((gltf: GLTF) => {
                resolve(loadGLTF(gltf));
            });
        });
    }

    static loadTexture(uri: string, options?: Partial<Sampler>): Promise<Texture2D> {
        return new Promise(async (resolve, reject) => {
            const response = await fetch(uri);
            const blob = await response.blob();
            const image = await createImageBitmap(blob);

            options = Utils.merge(options, {
                wrapS: Wrap.Repeat,
                wrapT: Wrap.Repeat,
                minFilter: SamplerFilter.Linear,
                magFilter: SamplerFilter.Linear,
                mip: true
            });

            const texture = new Texture2D(image.width, image.height, TextureFormat.BGRA8UNORM, options);
            texture.setData(image);

            resolve(texture);
        });
    }

    static loadVideo(uri: string): Promise<VideoTexture> {
        return new Promise(async (resolve, reject) => {
            const response = await fetch(uri);
            const blob = await response.blob();
            const video = URL.createObjectURL(blob);

            const texture = new VideoTexture(video);

            resolve(texture);
        });
    }

    static get<T extends Resource<T>>(handle: number): T {
        if (!this.resources.has(handle)) {
            console.log(this.resources);
            throw new Error('Can not find resource by handle: ' + handle);
        }

        return this.resources.get(handle) as T;
    }

    static has<T extends Resource<T>>(handle: number): boolean {
        return this.resources.has(handle);
    }

    static add<T>(handle: number, resource: Resource<T>) {
        this.resources.set(handle, resource as any);
        // const bytes = uuidParse(name) as Uint8Array;
        // const buffer = new Uint32Array(bytes.buffer);

        // this.uuidCache.set(buffer, name);
    }
}