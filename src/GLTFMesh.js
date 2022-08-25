import { Mesh, Primitive } from "./Mesh.js";
import { IMAGE } from "./Ventea.js";
import { Texture } from "./Texture.js";
import { Resource } from "./Resource.js";

const Type = {
    FLOAT: 0,
    UINT: 1,
    IMAGE: 2
};

const traverse = (gltf, node, out) => {
    if ('mesh' in node) {
        out.push(node.mesh);
    }

    if ('children' in node) {
        for (const child of node.children) {
            traverse(gltf, gltf.nodes[child], out);
        }
    }
}

const getAccessor = (asset, attribute, dataType) => {
    const accessor = asset.gltf.accessors[attribute];
    const bufferView = asset.gltf.bufferViews[accessor.bufferView];
    const componentType = accessor.componentType;
    const count = accessor.count;
    const type = accessor.type;

    const chunk = asset.glbData.binaryChunk;
    const buffer = chunk.buffer;

    const start = chunk.byteOffset + bufferView.byteOffset;
    const length = bufferView.byteLength;

    switch(dataType) {
        case Type.FLOAT: return new Float32Array(buffer, start, length / Float32Array.BYTES_PER_ELEMENT).slice();
        case Type.UINT:  return Uint32Array.from(new Uint16Array(buffer, start, length / Uint16Array.BYTES_PER_ELEMENT));
        case Type.IMAGE: return new Uint8Array(buffer, start, length).slice();
    }
}

export class GLTFMesh extends Mesh {
    constructor(resource) {
        const asset = resource.response.asset;
        const gltf = asset.gltf;
        const scene = gltf.scenes[gltf.scene ?? 0];
        const root = gltf.nodes[scene.nodes[0]];

        const images = resource.response.images;

        let meshes = [];
        traverse(gltf, root, meshes);

        let primitives = [];
        let materials = [];

        for(const [i, mat] of gltf.materials.entries()) {
            let material = {};

            if('pbrMetallicRoughness' in mat) {
                const index = gltf.textures[mat.pbrMetallicRoughness.baseColorTexture.index].source;

                let image = images[index];
                material.baseColorTexture = new Texture(new Resource(IMAGE, image));
            }

            if('normalTexture' in mat) {
                const index = gltf.textures[mat.normalTexture.index].source;

                let image = images[index];
                material.normalTexture = new Texture(new Resource(IMAGE, image));
            }

            materials[i] = material; 
        }

        for (const id of meshes) {
            const mesh = gltf.meshes[id];
            for (let primitive of mesh.primitives) {

                let positions = null;
                let texcoords = null;
                let normals = null;
                let indices = null;

                if ('POSITION' in primitive.attributes) {
                    positions = getAccessor(asset, primitive.attributes.POSITION, Type.FLOAT);
                }

                if ('TEXCOORD_0' in primitive.attributes) {
                    texcoords = getAccessor(asset, primitive.attributes.TEXCOORD_0, Type.FLOAT);
                }

                if ('NORMAL' in primitive.attributes) {
                    normals = getAccessor(asset, primitive.attributes.NORMAL, Type.FLOAT);
                }

                indices = getAccessor(asset, primitive.indices, Type.UINT);

                let material = null;

                if ('material' in primitive) {
                    material = primitive.material;
                }

                console.log(material);

                primitives.push(new Primitive(positions, texcoords, normals, indices, material))
            }
        }
        
        super(primitives, materials);
    }
}