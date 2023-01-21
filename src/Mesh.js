import { mat4 } from "../lib/gl-matrix/index.js";
import { AssetManager } from "./AssetManager.js";
import { Texture } from "./Texture.js";

export class Primitive {
    #vao;

    #buffers = {};

    #count;
    dirty = false;

    positions;
    indices;
    material;

    constructor(positions, texcoords, normals, indices, material = null) {
        this.#count = indices.length;

        this.positions = positions;
        this.indices = indices;
        this.material = material;

        this.#vao = gl.createVertexArray();
        gl.bindVertexArray(this.#vao);

        this.#buffers.positions = gl.createBuffer();
        this.#buffers.texcoords = gl.createBuffer();
        this.#buffers.normals = gl.createBuffer();
        this.#buffers.transforms = gl.createBuffer();
        this.#buffers.indices = gl.createBuffer();

        gl.enableVertexAttribArray(0);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.#buffers.positions);
        gl.vertexAttribPointer(0, 3, gl.FLOAT, gl.FALSE, 0, 0);
        gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);
        gl.bindBuffer(gl.ARRAY_BUFFER, null);

        if (texcoords) {
            gl.enableVertexAttribArray(1);
            gl.bindBuffer(gl.ARRAY_BUFFER, this.#buffers.texcoords);
            gl.vertexAttribPointer(1, 2, gl.FLOAT, gl.FALSE, 0, 0);
            gl.bufferData(gl.ARRAY_BUFFER, texcoords, gl.STATIC_DRAW);
            gl.bindBuffer(gl.ARRAY_BUFFER, null);
        }

        if (normals) {
            gl.enableVertexAttribArray(2);
            gl.bindBuffer(gl.ARRAY_BUFFER, this.#buffers.normals);
            gl.vertexAttribPointer(2, 3, gl.FLOAT, gl.FALSE, 0, 0);
            gl.bufferData(gl.ARRAY_BUFFER, normals, gl.STATIC_DRAW);
            gl.bindBuffer(gl.ARRAY_BUFFER, null);
        }

        /*const t = new Float32Array(mat4.identity([]));//new Float32Array(transform ?? mat4.identity([]));

        gl.bindBuffer(gl.ARRAY_BUFFER, this.#buffers.transforms);
        gl.bufferData(gl.ARRAY_BUFFER, t, gl.STATIC_DRAW);
        for (var ii = 0; ii < 4; ++ii) {
            gl.enableVertexAttribArray(3 + ii);
            gl.vertexAttribPointer(3 + ii, 4, gl.FLOAT, gl.FALSE, 64, ii * 16);
            //gl.vertexAttrib4fv(3 + ii, [t[ii], t[4 + ii], t[8 + ii], t[12 + ii]]);
            gl.vertexAttribDivisor(3 + ii, 1);
        }
        gl.bindBuffer(gl.ARRAY_BUFFER, null);*/

        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.#buffers.indices);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);

        gl.bindVertexArray(null);
    }

    draw() {
        gl.bindVertexArray(this.#vao);
        gl.drawElements(gl.TRIANGLES, this.#count, gl.UNSIGNED_INT, 0);
        gl.bindVertexArray(null);
    }

    static bakeTranform(vertices, transform) {
        for(let i = 0; i < vertices.length; i += 3) {
            const vec = [vertices[i], vertices[i+1], vertices[i+2], 1];
            let transformed = [];
            vec4.transformMat4(transformed, vec, transform);
            vertices[i]   = transformed[0];
            vertices[i+1] = transformed[1];
            vertices[i+2] = transformed[2];
        }
    }

    static async create(primitive, asset, gltf, transform) {

        let positions = null; 
        let texcoords = null; 
        let normals = null; 
        let indices = null; 
        
        if('POSITION' in primitive.attributes) {
            const pos = await asset.accessorData(primitive.attributes.POSITION);
            positions = new Float32Array(pos.buffer, pos.byteOffset, pos.byteLength / Float32Array.BYTES_PER_ELEMENT);
        }
        if('TEXCOORD_0' in primitive.attributes) {
            const tex = await asset.accessorData(primitive.attributes.TEXCOORD_0);
            texcoords = new Float32Array(tex.buffer, tex.byteOffset, tex.byteLength / Float32Array.BYTES_PER_ELEMENT);
        }
        if('NORMAL' in primitive.attributes) {
            const nor = await asset.accessorData(primitive.attributes.NORMAL);
            normals = new Float32Array(nor.buffer, nor.byteOffset, nor.byteLength / Float32Array.BYTES_PER_ELEMENT);
        }

        const ind = await asset.accessorData(primitive.indices);
        if(gltf.accessors[primitive.indices].componentType == 5125) {
            indices = new Uint32Array(ind.buffer, ind.byteOffset, ind.byteLength / Uint32Array.BYTES_PER_ELEMENT);
        } else {
            indices = new Uint32Array(new Uint16Array(ind.buffer, ind.byteOffset, ind.byteLength / Uint16Array.BYTES_PER_ELEMENT));
        }

        //mat4.multiply(transform, mat4.fromScaling([], [2,2,2]), transform);

        //Primitive.bakeTranform(positions, transform);

        let texture = null;
        let norm = null;

        if ('material' in primitive) {
            let material = gltf.materials[primitive.material];

            if(material.pbrMetallicRoughness.baseColorTexture) {
                let baseColorTexture = gltf.textures[material.pbrMetallicRoughness.baseColorTexture.index];
                let imageIndex = baseColorTexture.source;

                let image = await asset.imageData.get(imageIndex);
                texture = await Texture.create(image);
            }

            if(material.normalTexture) {
                let normalTexture = gltf.textures[material.normalTexture.index];
                let imageIndex = normalTexture.source;

                let image = await asset.imageData.get(imageIndex);
                norm = await Texture.create(image);
            }
        }

        return new Primitive(positions, texcoords, normals, indices, texture, norm, transform);
    }
}
export class Mesh {
    primitives = [];
    materials = [];
    assetId = 0;

    constructor(primitives, materials) {
        this.primitives = primitives;
        this.materials = materials;
        
        this.assetId = AssetManager.ASSETS.length;
        AssetManager.ASSETS.push(this);
    }

    draw() {
        for (const primitive of this.primitives) {
            if(primitive.material != null) {
                const material = this.materials[primitive.material];

                if('baseColorTexture' in material) {
                    material.baseColorTexture.bindTexture(0);
                }

                if('normalTexture' in material) {
                    material.normalTexture.bindTexture(1);
                }
            } else {
                Texture.NO_TEXTURE.bindTexture(0);
                Texture.NORMAL_TEXTURE.bindTexture(1);
            }

            primitive.draw();
        }
    }
}