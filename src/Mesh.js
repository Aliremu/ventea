import { mat4 } from "../lib/gl-matrix/index.js";
import { Texture } from "./Texture.js";

export class Primitive {
    #vao;

    #buffers = {};

    #count;
    #texture;
    #norm;
    dirty = false;

    positions;
    indices;

    constructor(positions, texcoords, normals, indices, image = null, norm = null, transform = null) {
        this.#texture = image;
        this.#norm = norm;
        this.#count = indices.length;

        this.positions = positions;
        this.indices = indices;

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

        if (!this.dirty) {
            if (this.#texture != null) {
                this.#texture.bindTexture(0);
            } else {
                Texture.NO_TEXTURE.bindTexture(0);
            }

            if (this.#norm != null) {
                this.#norm.bindTexture(1);
            } else {
                Texture.NORMAL_TEXTURE.bindTexture(1);
            }
        }

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

    constructor(primitives) {
        this.primitives = primitives;
    }

    draw() {
        for (const primitive of this.primitives) {
            //console.log(primitive);
            primitive.draw();
        }
    }

    static traverse(gltf, node, transform, out) {
        const translation = node.translation ?? [0, 0, 0];
        const rotation = node.rotation ?? [0, 0, 0, 1];
        const scale = node.scale ?? [1, 1, 1];

        /*const t = mat4.fromRotationTranslationScale([], rotation, translation, scale);

        const kek = mat4.multiply([], transform, t);*/

        if ('mesh' in node) {
            out.push([node.mesh, []]);
        }

        if ('children' in node) {
            for (const child of node.children) {
                this.traverse(gltf, gltf.nodes[child], [], out);
            }
        }
    }

    static async create(file, loader) {
        let asset = await loader.load(file, (a) => {
            console.log(a.loaded / a.total);
        });

        window.asset = asset;

        //let times = await asset.accessorData(29);
        //console.log(new Float32Array(times.buffer, times.byteOffset, times.byteLength / Float32Array.BYTES_PER_ELEMENT));
        //console.log(await asset.accessorData(30));

        let gltf = asset.gltf;
        let sceneIndex = gltf.scene | 0;
        let scene = gltf.scenes[sceneIndex];
        let rootNodes = scene.nodes;

        let primitives = [];

        console.log(asset);

        /* for (let nodeIndex of rootNodes) {
            // get to the first primitive
            let node = gltf.nodes[nodeIndex];
            let child = gltf.nodes[node.children[0]];
            let mesh = gltf.meshes[child.mesh];

            console.log(mesh);
        
            for(let primitive of mesh.primitives) {
                primitives.push(await Primitive.create(primitive, asset, gltf));
            }
        }*/

        let test = [];
        Mesh.traverse(gltf, gltf.nodes[gltf.scenes[0].nodes[0]], mat4.identity([]), test);

        for (const [id, transform] of test) {
            const mesh = gltf.meshes[id];
            for (let primitive of mesh.primitives) {
                primitives.push(await Primitive.create(primitive, asset, gltf, transform));
            }
        }

        /*for (const node of gltf.nodes) {
            if ('mesh' in node) {
                const mesh = gltf.meshes[node.mesh]
                if (mesh.name == 'MASH3_ReproMesh1_ground_0') continue;

                for (let primitive of mesh.primitives) {
                    const { translation = [0, 0, 0], rotation = [0, 0, 0, 1], scale = [1, 1, 1] } = node;
                    const transform = {
                        translation: translation,
                        rotation: rotation,
                        scale: scale
                    };

                    primitives.push(await Primitive.create(primitive, asset, gltf, transform));
                }
            }
        }*/

        return new Mesh(primitives);
    }
}