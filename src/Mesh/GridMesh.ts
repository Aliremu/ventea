import { MeshData } from "./MeshData";

export class GridMesh extends MeshData {
    constructor(width: number, height: number) {
        let positions: Float32Array = new Float32Array(2 * (width + 1 + height + 1) * 3);
        let normals: Float32Array   = new Float32Array(2 * (width + 1 + height + 1) * 3).fill(0);
        let texCoords: Float32Array = new Float32Array(2 * (width + 1 + height + 1) * 2).fill(0);
        let indices = new Uint32Array(2 * (width + 1 + height + 1));

        let offset = 0;
        let index = 0;

        for(let x = 0; x < width + 1; x++) {
            indices[index] = index++;

            positions[offset++] = (x / (width + 1)) * width - width / 2;
            normals[offset] = 1;
            positions[offset++] = 0;
            positions[offset++] = -height / 2;

            indices[index] = index++;
            
            positions[offset++] = (x / (width + 1)) * width - width / 2;
            normals[offset] = 1;
            positions[offset++] = 0;
            positions[offset++] = height / 2 - (height / (height + 1));
        }

        for(let y = 0; y < height + 1; y++) {
            indices[index] = index++;
            
            positions[offset++] = -width / 2;
            normals[offset] = 1;
            positions[offset++] = 0;
            positions[offset++] = (y / (height + 1)) * height - height / 2;

            indices[index] = index++;
            
            positions[offset++] = width / 2 - (width / (width + 1));
            normals[offset] = 1;
            positions[offset++] = 0;
            positions[offset++] = (y / (height + 1)) * height - height / 2;
        }

        super(positions, normals, texCoords, indices);
    }
}