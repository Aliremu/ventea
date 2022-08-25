import { Primitive, Mesh } from "./Mesh.js";

export class Cube extends Mesh {
    constructor(x = 1, y = 1, z = 1) {
        const halfX = x / 2;
        const halfY = y / 2;
        const halfZ = z / 2;

        const positions = new Float32Array([
             // Front face
            -halfX, -halfY,  halfZ,
             halfX, -halfY,  halfZ,
             halfX,  halfY,  halfZ,
            -halfX,  halfY,  halfZ,

             // Back face
            -halfX, -halfY, -halfZ,
            -halfX,  halfY, -halfZ,
             halfX,  halfY, -halfZ,
             halfX, -halfY, -halfZ,

             // Top face
            -halfX,  halfY, -halfZ,
            -halfX,  halfY,  halfZ,
             halfX,  halfY,  halfZ,
             halfX,  halfY, -halfZ,

             // Bottom face
            -halfX, -halfY, -halfZ,
             halfX, -halfY, -halfZ,
             halfX, -halfY,  halfZ,
            -halfX, -halfY,  halfZ,

             // Right face
             halfX, -halfY, -halfZ,
             halfX,  halfY, -halfZ,
             halfX,  halfY,  halfZ,
             halfX, -halfY,  halfZ,

             // Left face
            -halfX, -halfY, -halfZ,
            -halfX, -halfY,  halfZ,
            -halfX,  halfY,  halfZ,
            -halfX,  halfY, -halfZ,
        ]);

        const normals = new Float32Array([
            0.0, 0.0, 1.0,
            0.0, 0.0, 1.0,
            0.0, 0.0, 1.0,
            0.0, 0.0, 1.0,

            0.0, 0.0, -1.0,
            0.0, 0.0, -1.0,
            0.0, 0.0, -1.0,
            0.0, 0.0, -1.0,

            0.0, 1.0, 0.0,
            0.0, 1.0, 0.0,
            0.0, 1.0, 0.0,
            0.0, 1.0, 0.0,

            0.0, -1.0, 0.0,
            0.0, -1.0, 0.0,
            0.0, -1.0, 0.0,
            0.0, -1.0, 0.0,

            1.0, 0.0, 0.0,
            1.0, 0.0, 0.0,
            1.0, 0.0, 0.0,
            1.0, 0.0, 0.0,

            -1.0, 0.0, 0.0,
            -1.0, 0.0, 0.0,
            -1.0, 0.0, 0.0,
            -1.0, 0.0, 0.0,
        ]);

        const texcoords = new Float32Array([
            0, 0,
            1, 0,
            1, 1,
            0, 1,

            0, 0,
            1, 0,
            1, 1,
            0, 1,

            0, 0,
            1, 0,
            1, 1,
            0, 1,

            0, 0,
            1, 0,
            1, 1,
            0, 1,

            0, 0,
            1, 0,
            1, 1,
            0, 1,

            0, 0,
            1, 0,
            1, 1,
            0, 1
        ]);

        const indices = new Uint32Array([
            0, 1, 2, 0, 2, 3,    // front
            4, 5, 6, 4, 6, 7,    // back
            8, 9, 10, 8, 10, 11,   // top
            12, 13, 14, 12, 14, 15,   // bottom
            16, 17, 18, 16, 18, 19,   // right
            20, 21, 22, 20, 22, 23,   // left
        ]);

        super([new Primitive(positions, texcoords, normals, indices)]);

        this.x = x;
        this.y = y;
        this.z = z;
    }
}