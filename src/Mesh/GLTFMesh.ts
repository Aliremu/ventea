import { GLTF, GLTFMaterial, GLTFScene } from '@loaders.gl/gltf';
import { mat4, vec3 } from 'gl-matrix';
import { Vector3, Vector4 } from '../Math/Vector';
import { Texture2D } from '../Render/Texture2D';
import { TextureFormat } from '../Render/TextureFormat';
import { UniformBuffer } from '../Render/UniformBuffer';
import { Material } from './Material';
import { Mesh, SubMesh } from './Mesh';

enum Type {
    FLOAT,
    UINT,
    IMAGE
};
/*
const getAccessor = (asset: GltfAsset, attribute: number, dataType: Type) => {
    const accessor = asset.gltf.accessors![attribute];
    const bufferView = asset.gltf.bufferViews![accessor.bufferView!];
    const componentType = accessor.componentType;
    const count = accessor.count;
    const type = accessor.type;

    const chunk = asset.glbData!.binaryChunk;
    const buffer = chunk.buffer;

    const start = (accessor.byteOffset ?? 0) + chunk.byteOffset + (bufferView.byteOffset ?? 0);
    // const length = bufferView.byteLength;
    const length = accessor.count;

    console.log(start, length);

    switch (dataType) {
        case Type.FLOAT:
            return new Float32Array(buffer, start, bufferView.byteLength / Float32Array.BYTES_PER_ELEMENT);
        case Type.UINT:
            if (componentType == 5125) {
                console.log('CUM1trytyr', length);
                return new Uint32Array(buffer, start, length);// / Uint32Array.BYTES_PER_ELEMENT); 
            } else {
                console.log('SPEED BUNDA');
                return Uint32Array.from(new Uint16Array(buffer, start, bufferView.byteLength / Uint16Array.BYTES_PER_ELEMENT));
            }
        case Type.IMAGE:
            return new Uint8Array(buffer, start, length).slice();
    }
}*/

const bakeTransforms = (buffer: Float32Array, transform: Float32Array) => {
    const size = buffer.length;
    const vec = new Vector3();

    for(let i = 0; i < size / 3; i++) {
        vec.x = buffer[i * 3    ];
        vec.y = buffer[i * 3 + 1];
        vec.z = buffer[i * 3 + 2];

        vec3.transformMat4(vec.buffer, vec.buffer, transform);

        buffer[i * 3    ] = vec.x;
        buffer[i * 3 + 1] = vec.y;
        buffer[i * 3 + 2] = vec.z;
    }
}

const traverseNode = (node: any, transform: mat4, out: Map<string, any>) => {
    let t = mat4.create();
    if('matrix' in node) {
        t = node.matrix;
    } else {
        mat4.fromRotationTranslationScale(t, node.rotation ?? [0, 0, 0, 1], node.translation ?? [0, 0, 0], node.scale ?? [1, 1, 1]);
    }
    const copy = mat4.create();

    mat4.multiply(copy, transform, t);

    if('mesh' in node) {
        if(!out.has(node.id)) {
            out.set(node.id, { mesh: node.mesh, transform: copy });
            return;
        }
    }

    if('children' in node) {
        for(const child of node.children) {
            traverseNode(child, copy, out);
        }
    }
}

export class GLTFMesh extends Mesh {
    constructor(gltf: GLTF) {
        // const gltf: GLTF = await load(file, GLTFLoader, { DracoLoader, decompress: true });
        console.log(gltf);

        const scene = gltf.scene as GLTFScene;
        console.log(gltf);
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

        const t = mat4.create();
        mat4.identity(t);

        const test: Map<string, any> = new Map<string, any>();
        traverseNode({ children: (gltf.scene as any).nodes }, t, test);

        console.log(test);

        // for (const mesh of gltf.meshes!) {
        for(const [key, value] of test) {
            const mesh = value.mesh;
            const transform = value.transform;
        // for (const node of gltf.nodes!) {
            //if (!('mesh' in node)) continue;

            //const mesh = node.mesh as any;
            
            //fromRotationTranslationScale(transform, node.rotation ?? [0, 0, 0, 1], node.translation ?? [0, 0, 0], node.scale ?? [1, 1, 1]);
            
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

                const buffer: UniformBuffer = new UniformBuffer(28);
                buffer.data.fill(0);
                buffer.data[0] = 1;
                buffer.data[1] = 1;
                buffer.data[2] = 1;
                buffer.data[3] = 1;

                const material: Material = new Material();

                if (mat?.pbrMetallicRoughness?.baseColorTexture) {
                    const image = (mat.pbrMetallicRoughness.baseColorTexture as any).texture.source.image;
                    // console.log(image);
                    // const t = new WebGPUTexture(image.width, image.height, image);
                    const texture = new Texture2D(image.width, image.height, TextureFormat.BGRA8UNORM, true);
                    texture.setData(image);
                    material.set('albedoTexture', texture);
                } else {
                    material.set('albedoTexture', Texture2D.DEFAULT_TEXTURE);
                }

                if (mat?.pbrMetallicRoughness?.metallicRoughnessTexture) {
                    const image = (mat.pbrMetallicRoughness.metallicRoughnessTexture as any).texture.source.image;

                    const texture = new Texture2D(image.width, image.height, TextureFormat.BGRA8UNORM, true);
                    texture.setData(image);
                    material.set('ao_m_rTexture', texture);
                } else {
                    material.set('ao_m_rTexture', Texture2D.NORMAL_TEXTURE);
                }

                if(mat?.pbrMetallicRoughness?.baseColorFactor) {
                    const color = mat?.pbrMetallicRoughness?.baseColorFactor;
                    buffer.data[0] = color[0];
                    buffer.data[1] = color[1];
                    buffer.data[2] = color[2];
                    buffer.data[3] = color[3];
                }

                if (mat?.normalTexture) {
                    const image = (mat.normalTexture as any).texture.source.image;

                    const texture = new Texture2D(image.width, image.height, TextureFormat.BGRA8UNORM, true);
                    texture.setData(image);
                    material.set('normalTexture', texture);
                } else {
                    material.set('normalTexture', Texture2D.NORMAL_TEXTURE);
                }

                if (mat?.occlusionTexture) {
                    const image = (mat.occlusionTexture as any).texture.source.image;

                    const texture = new Texture2D(image.width, image.height, TextureFormat.BGRA8UNORM, true);
                    texture.setData(image);
                    material.set('occlusionTexture', texture);
                } else {
                    material.set('occlusionTexture', Texture2D.NORMAL_TEXTURE);
                }

                buffer.setData(0, buffer.data, 0, 7);

                // WebGPUContext.queue.writeBuffer(buffer.buffer, 0, buffer.data, 0, 4);

                material.set('pbr_material', buffer);
                // descriptor.push({ binding: 0, resource: { buffer: buffer.buffer } });

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

        //console.log(positions);
        //console.log(indices);

        super(positions, normals, texCoords, indices);
        this.subMeshes = subMeshes;

        for (const subMesh of subMeshes) {
            // subMesh.material!.bindGroup = WebGPUContext.device.createBindGroup({
            //     layout: this.pipeline.as<WebGPUPipieline>().pipeline.getBindGroupLayout(2),
            //     entries: subMesh.material!.descriptor
            // });

            subMesh.material!.pipeline = this.pipeline;
            subMesh.material!.build();
        }
    }
}