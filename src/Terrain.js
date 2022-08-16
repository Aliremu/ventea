import '../lib/perlin/perlin.js';
import { Mesh, Primitive } from './Mesh.js';
import { Texture } from './Texture.js';

export class Terrain {
    vertices = [];
    normals = [];
    indices = [];
    heightMap;

    dirt_diff;
    dirt_norm;

    path_diff;
    path_norm;

    rock_diff;
    rock_norm;

    snow_diff;
    snow_norm;

    noise;

    constructor(width, depth) {
        this.width = width;
        this.depth = depth;

        noise.seed(Math.random());
        let p = 0;
        //this.heightMap = new Float32Array(width * depth);
        let test = [];
        for (let z = 0; z < depth; z++) {
            test[z] = [];
            for (let x = 0; x < width; x++) {
                let y = Math.max(0, noise.octaveSimple2(x / width, z / depth, 5) * 0.5 + 0.5);
                y = 0 * Math.pow(y, Math.E);
                //y = y + (y % 15);

                if(Math.abs(x - width / 2) < 120 && Math.abs(z - depth / 2) < 40) {
                    y = -0.5;
                }

                test[z][x] = y;
                //this.heightMap[p] = y;
                this.vertices.push([x - width / 2, y, z - depth / 2]);
                this.normals.push([0, 0, 0]);
                p++;
            }
        }

        this.heightMap = new Float32Array((test[0].map((_, colIndex) => test.map(row => row[colIndex]))).flat());

        //indices.push_back((unsigned int)((z + 0) * (100 + 1) + 0));
        for (let z = 0; z < depth - 1; z++) {
            for (let x = 0; x < width - 1; x++) {

                let row1 = z * (width);
                let row2 = (z + 1) * (width);

                this.indices.push(row1 + x);
                this.indices.push(row2 + x );
                this.indices.push(row2 + x + 1);

                /*let p2 = this.vertices[row1 + x];
                let p3 = this.vertices[row1 + x + 1];
                let p1 = this.vertices[row2 + x + 1];

                let V = p2 - p1;
                let W = p3 - p1;

                let N = vec3.cross([], V, W);*/

                //normals.push_back(N);

                // triangle 2
                this.indices.push(row1 + x);
                this.indices.push(row2 + x + 1);
                this.indices.push(row1 + x + 1);

                /*let p21 = this.vertices[row1 + x];
                let p31 = this.vertices[row2 + x + 1];
                let p11 = this.vertices[row2 + x];

                let V1 = p21 - p11;
                let W1 = p31 - p11;

                let N1 = vec3.cross([], V1, W1);*/
            }
        }

        for (let i = 0; i < this.indices.length;) {
            let facenormal = vec3.cross([],
                vec3.sub([], this.vertices[this.indices[i + 1]], this.vertices[this.indices[i]]),
                vec3.sub([], this.vertices[this.indices[i + 2]], this.vertices[this.indices[i]])
            );

            this.normals[this.indices[i]] = vec3.add([], this.normals[this.indices[i]], facenormal);
            i++;
            this.normals[this.indices[i]] = vec3.add([], this.normals[this.indices[i]], facenormal);
            i++;
            this.normals[this.indices[i]] = vec3.add([], this.normals[this.indices[i]], facenormal);
            i++;

        }
    }

    async createMesh() {
        let primitives = [];
        let limit = 1000;

        let positions = new Float32Array(this.vertices.flat());

        let normals = new Float32Array(this.normals.flat());

        this.dirt_diff = await Texture.create('./assets/dirt_diff.jpg');
        this.dirt_norm = await Texture.create('./assets/dirt_norm.jpg');

        this.path_diff = await Texture.create('./assets/path_diff.jpg');
        this.path_norm = await Texture.create('./assets/path_norm.jpg');

        this.rock_diff = await Texture.create('./assets/rock_diff.jpg');
        this.rock_norm = await Texture.create('./assets/rock_norm.jpg');

        this.snow_diff = await Texture.create('./assets/snow_diff.jpg');
        this.snow_norm = await Texture.create('./assets/snow_norm.jpg');

        this.noise = await Texture.create('./assets/noise.jpg');


        for(let i = 0; i < Math.ceil(this.indices.length / 3 / 50000); i++) {
            let idx = i * 3 * 50000;
            let end = Math.min(idx + 150000, this.indices.length);

            console.log(idx, end);

            let indices = new Uint32Array(this.indices.slice(idx, end).flat());

            let p = new Primitive(positions, null, normals, indices, this.dirt_diff, this.dirt_norm);
            //p.dirty = true;

            primitives.push(p);
        }
        /*while(this.vertices.length > 0) {
            
        }*/

        return new Mesh(primitives);
    }
}