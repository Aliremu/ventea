import { MeshData } from "./MeshData";

export class PlaneMesh extends MeshData {
    constructor(width = 1, height = 1, subX = 1, subY = 1) {
        const halfX = width / 2;
        const halfY = height / 2;

        let positions = new Float32Array((subX + 1) * (subY + 1) * 3);
        let normals = new Float32Array((subX + 1) * (subY + 1) * 3);
        let texCoords = new Float32Array((subX + 1) * (subY + 1) * 2);
        let indices = new Uint32Array((subX * subY * 6));

        const incX = width / subX;
        const incY = height / subY;

        let p = 0;

        for(let y = -halfY; y <= halfY; y += incY) {
            for(let x = -halfX; x <= halfX; x += incX) {
                positions[3*p] = x;
                positions[3*p+1] = y;
                positions[3*p+2] = 0;

                normals[3*p] = 0;
                normals[3*p+1] = 0;
                normals[3*p+2] = 1;

                texCoords[2*p] = (x + halfX) / (width);
                texCoords[2*p+1] = (height - (y + halfY)) / (height);

                p++;
            }
        }

        let index = 0;

        for (let z = 0; z < subY; z++) {
            for (let x = 0; x < subX; x++) {

                let row1 = z * (subX + 1);
                let row2 = (z + 1) * (subX + 1);

                indices[index++] = row1 + x;
                indices[index++] = row1 + x + 1;
                indices[index++] = row2 + x + 1;

                indices[index++] = row1 + x;
                indices[index++] = row2 + x + 1;
                indices[index++] = row2 + x;
            }
        }

        super(positions, normals, texCoords, indices);
    }
}