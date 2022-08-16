import { Primitive, Mesh } from "./Mesh.js";

export class Sphere extends Mesh {
    static async create(radius) {
        let v = [];
        let n = [];
        let t = [];
        let i = [];

        let rings = 24;
        let sectors = rings * 2;

        const R = 1 / (rings - 1);
        const S = 1 / (sectors - 1);
        let r, s;

        v = new Array(rings * sectors * 3);
        n = new Array(rings * sectors * 3);
        t = new Array(rings * sectors * 2);
        let v_i = 0;
        let n_i = 0;
        let t_i = 0;
        for (r = 0; r < rings; r++) {
            for (s = 0; s < sectors; s++) {
                let y = Math.sin(-Math.PI / 2 + Math.PI * r * R);
                let x = Math.cos(2 * Math.PI * s * S) * Math.sin(Math.PI * r * R);
                let z = Math.sin(2 * Math.PI * s * S) * Math.sin(Math.PI * r * R);

                t[t_i++] = s * S;
                t[t_i++] = r * R;

                v[v_i++] = x * radius;
                v[v_i++] = y * radius;
                v[v_i++] = z * radius;

                n[n_i++] = x;
                n[n_i++] = y;
                n[n_i++] = z;
            }
        }

        i = new Array(rings * sectors * 4);
        let i_x = 0;
        let i_y = 0;
        for (r = 1; r < rings; r++) {
            for (s = 1; s < sectors; s++, i_y++) {
                // i[i_i++] = r * sectors + s;
                // i[i_i++] = r * sectors + (s + 1);
                // i[i_i++] = (r + 1) * sectors + (s + 1);
                // i[i_i++] = (r + 1) * sectors + s;

                i[i_x] = i_y;               i_x++;
                i[i_x] = i_y + sectors;     i_x++;
                i[i_x] = i_y + 1;           i_x++;
                // second half of QUAD
                i[i_x] = i_y + sectors;     i_x++;
                i[i_x] = i_y + sectors + 1; i_x++;
                i[i_x] = i_y + 1;           i_x++;
            }

            i[i_x] = i_y;               i_x++;
            i[i_x] = i_y + sectors;     i_x++;
            i[i_x] = i_y + 1 - sectors; i_x++;
            // second half of QUAD
            i[i_x] = i_y + sectors;     i_x++;
            i[i_x] = i_y + 1;           i_x++;
            i[i_x] = i_y - sectors + 1; i_x++;
            i_y++;
        }

        let positions = new Float32Array(v);
        let texcoords = new Float32Array(t);
        let normals   = new Float32Array(n);
        let indices = new Uint32Array(i);

        return new Mesh([new Primitive(positions, texcoords, normals, indices)]);
    }
}