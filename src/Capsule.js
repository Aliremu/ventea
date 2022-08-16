import { Primitive, Mesh } from "./Mesh.js";

export class Capsule extends Mesh {
    static async create(radius = 0.5, depth = 1, rings = 1, latitudes = 16, longitudes = 32) {
        let v = [];
        let n = [];
        let t = [];
        let i = [];

        let calcMiddle = rings > 0;
        let halfLats = latitudes / 2;
        let halfLatsn1 = halfLats - 1;
        let halfLatsn2 = halfLats - 2;
        let ringsp1 = rings + 1;
        let lonsp1 = longitudes + 1;
        let halfDepth = depth * 0.5;
        let summit = halfDepth + radius;

        // Vertex index offsets.
        let vertOffsetNorthHemi = longitudes;
        let vertOffsetNorthEquator = vertOffsetNorthHemi + lonsp1 * halfLatsn1;
        let vertOffsetCylinder = vertOffsetNorthEquator + lonsp1;
        let vertOffsetSouthEquator = calcMiddle ?
            vertOffsetCylinder + lonsp1 * rings :
            vertOffsetCylinder;
        let vertOffsetSouthHemi = vertOffsetSouthEquator + lonsp1;
        let vertOffsetSouthPolar = vertOffsetSouthHemi + lonsp1 * halfLatsn2;
        let vertOffsetSouthCap = vertOffsetSouthPolar + lonsp1;

        // Initialize arrays.
        let vertLen = vertOffsetSouthCap + longitudes;
        v = new Array(vertLen);
        t = new Array(vertLen);
        n = new Array(vertLen);

        let toTheta = 2.0 * Math.PI / longitudes;
        let toPhi = Math.PI / latitudes;
        let toTexHorizontal = 1.0 / longitudes;
        let toTexVertical = 1.0 / halfLats;

        // Calculate positions for texture coordinates vertical.
        let vtAspectRatio = 1.0;
        vtAspectRatio = halfLats / (ringsp1 + latitudes);
        /*switch (profile) {
            case UvProfile.Aspect:
                vtAspectRatio = radius / (depth + radius + radius);
                break;

            case UvProfile.Uniform:
                vtAspectRatio = halfLats / (ringsp1 + latitudes);
                break;

            case UvProfile.Fixed:
            default:
                vtAspectRatio = 1.0 / 3.0;
                break;
        }*/

        let vtAspectNorth = 1.0 - vtAspectRatio;
        let vtAspectSouth = vtAspectRatio;

        let thetaCartesian = new Array(longitudes);
        let rhoThetaCartesian = new Array(longitudes);
        let sTextureCache = new Array(lonsp1);

        // Polar vertices.
        for (let j = 0; j < longitudes; ++j)
        {
            let jf = j;
            let sTexturePolar = 1.0 - ((jf + 0.5) * toTexHorizontal);
            let theta = jf * toTheta;

            let cosTheta = Math.cos(theta);
            let sletheta = Math.sin(theta);

            thetaCartesian[j] = [cosTheta, sletheta];

            rhoThetaCartesian[j] = [radius * cosTheta, radius * sletheta];

            // North.
            v[j] = [0, summit, 0];

            t[j] = [sTexturePolar, 1];

            n[j] = [0, 1, 0];

            // South.
            let idx = vertOffsetSouthCap + j;
            v[idx] = [0, summit, 0];

            t[idx] = [sTexturePolar, 0];

            n[idx] = [0, -1, 0];
        }

        // Equatorial vertices.
        for (let j = 0; j < lonsp1; ++j)
        {
            let sTexture = 1.0 - j * toTexHorizontal;
            sTextureCache[j] = sTexture;

            // Wrap to first element upon reaching last.
            let jMod = j % longitudes;
            let tc = thetaCartesian[jMod];
            let rtc = rhoThetaCartesian[jMod];

            // North equator.
            let idxn = vertOffsetNorthEquator + j;
            v[idxn] = [rtc[0], halfDepth, -rtc[1]];

            t[idxn] = [sTexture, vtAspectNorth];

            n[idxn] = [tc[0], 0, -tc[1]];

            // South equator.
            let idxs = vertOffsetSouthEquator + j;
            v[idxs] = [rtc[0], -halfDepth, -rtc[1]];
            
            t[idxs] = [sTexture, vtAspectSouth];

            n[idxs] = [tc[0], 0, -tc[1]];
        }

        //console.log("EQUI", v);


        // Hemisphere vertices.
        for (let i = 0; i < halfLatsn1; ++i)
        {
            let ip1f = i + 1.0;
            let phi = ip1f * toPhi;

            // For coordinates.
            let cosPhiSouth = Math.cos(phi);
            let sinPhiSouth = Math.sin(phi);

            // Symmetrical hemispheres mean cosine and sine only needs
            // to be calculated once.
            let cosPhiNorth = sinPhiSouth;
            let sinPhiNorth = -cosPhiSouth;

            let rhoCosPhiNorth = radius * cosPhiNorth;
            let rhoSinPhiNorth = radius * sinPhiNorth;
            let zOffsetNorth = halfDepth - rhoSinPhiNorth;

            let rhoCosPhiSouth = radius * cosPhiSouth;
            let rhoSinPhiSouth = radius * sinPhiSouth;
            let zOffsetSouth = -halfDepth - rhoSinPhiSouth;

            // For texture coordinates.
            let tTexFac = ip1f * toTexVertical;
            let cmplTexFac = 1.0 - tTexFac;
            let tTexNorth = cmplTexFac + vtAspectNorth * tTexFac;
            let tTexSouth = cmplTexFac * vtAspectSouth;

            let iLonsp1 = i * lonsp1;
            let vertCurrLatNorth = vertOffsetNorthHemi + iLonsp1;
            let vertCurrLatSouth = vertOffsetSouthHemi + iLonsp1;

            for (let j = 0; j < lonsp1; ++j)
            {
                let jMod = j % longitudes;

                let sTexture = sTextureCache[j];
                let tc = thetaCartesian[jMod];

                // North hemisphere.
                let idxn = vertCurrLatNorth + j;
                v[idxn] = [rhoCosPhiNorth * tc[0], zOffsetNorth, -rhoCosPhiNorth * tc[1]];

                t[idxn] = [sTexture, tTexNorth];

                n[idxn] = [cosPhiNorth * tc[0], -sinPhiNorth, -cosPhiNorth * tc[1]];

                // South hemisphere.
                let idxs = vertCurrLatSouth + j;
                v[idxs] = [rhoCosPhiSouth * tc[0], zOffsetSouth, -rhoCosPhiSouth * tc[1]];

                t[idxs] = [sTexture, tTexSouth];
                
                n[idxs] = [cosPhiSouth * tc[0], -sinPhiSouth, -cosPhiSouth * tc[1]];
            }
        }

        // Cylinder vertices.
        if (calcMiddle) {
            // Exclude both origin and destination edges
            // (North and South equators) from the leterpolation.
            let toFac = 1.0 / ringsp1;
            let idxCylLat = vertOffsetCylinder;

            for (let h = 1; h < ringsp1; ++h)
            {
                let fac = h * toFac;
                let cmplFac = 1.0 - fac;
                let tTexture = cmplFac * vtAspectNorth + fac * vtAspectSouth;
                let z = halfDepth - depth * fac;

                for (let j = 0; j < lonsp1; ++j)
                {
                    let jMod = j % longitudes;
                    let tc = thetaCartesian[jMod];
                    let rtc = rhoThetaCartesian[jMod];
                    let sTexture = sTextureCache[j];

                    v[idxCylLat] = [rtc[0], z, -rtc[1]];

                    t[idxCylLat] = [sTexture, tTexture];

                    n[idxCylLat] = [tc[0], 0, -tc[1]];

                    ++idxCylLat;
                }
            }
        }

        // Triangle indices.
        // Stride is 3 for polar triangles;
        // stride is 6 for two triangles forming a quad.
        let lons3 = longitudes * 3;
        let lons6 = longitudes * 6;
        let hemiLons = halfLatsn1 * lons6;

        let triOffsetNorthHemi = lons3;
        let triOffsetCylinder = triOffsetNorthHemi + hemiLons;
        let triOffsetSouthHemi = triOffsetCylinder + ringsp1 * lons6;
        let triOffsetSouthCap = triOffsetSouthHemi + hemiLons;

        let fsLen = triOffsetSouthCap + lons3;
        let tris = new Array(fsLen);

        // Polar caps.
        for (let i = 0, k = 0, m = triOffsetSouthCap; i < longitudes; ++i, k += 3, m += 3)
        {
            // North.
            tris[k] = i;
            tris[k + 1] = vertOffsetNorthHemi + i;
            tris[k + 2] = vertOffsetNorthHemi + i + 1;

            // South.
            tris[m] = vertOffsetSouthCap + i;
            tris[m + 1] = vertOffsetSouthPolar + i + 1;
            tris[m + 2] = vertOffsetSouthPolar + i;
        }

        // Hemispheres.
        for (let i = 0, k = triOffsetNorthHemi, m = triOffsetSouthHemi; i < halfLatsn1; ++i)
        {
            let iLonsp1 = i * lonsp1;

            let vertCurrLatNorth = vertOffsetNorthHemi + iLonsp1;
            let vertNextLatNorth = vertCurrLatNorth + lonsp1;

            let vertCurrLatSouth = vertOffsetSouthEquator + iLonsp1;
            let vertNextLatSouth = vertCurrLatSouth + lonsp1;

            for (let j = 0; j < longitudes; ++j, k += 6, m += 6)
            {
                // North.
                let north00 = vertCurrLatNorth + j;
                let north01 = vertNextLatNorth + j;
                let north11 = vertNextLatNorth + j + 1;
                let north10 = vertCurrLatNorth + j + 1;

                tris[k] = north00;
                tris[k + 1] = north11;
                tris[k + 2] = north10;

                tris[k + 3] = north00;
                tris[k + 4] = north01;
                tris[k + 5] = north11;

                // South.
                let south00 = vertCurrLatSouth + j;
                let south01 = vertNextLatSouth + j;
                let south11 = vertNextLatSouth + j + 1;
                let south10 = vertCurrLatSouth + j + 1;

                tris[m] = south00;
                tris[m + 1] = south11;
                tris[m + 2] = south10;

                tris[m + 3] = south00;
                tris[m + 4] = south01;
                tris[m + 5] = south11;
            }
        }

        // Cylinder.
        for (let i = 0, k = triOffsetCylinder; i < ringsp1; ++i)
        {
            let vertCurrLat = vertOffsetNorthEquator + i * lonsp1;
            let vertNextLat = vertCurrLat + lonsp1;

            for (let j = 0; j < longitudes; ++j, k += 6)
            {
                let cy00 = vertCurrLat + j;
                let cy01 = vertNextLat + j;
                let cy11 = vertNextLat + j + 1;
                let cy10 = vertCurrLat + j + 1;

                tris[k] = cy00;
                tris[k + 1] = cy11;
                tris[k + 2] = cy10;

                tris[k + 3] = cy00;
                tris[k + 4] = cy01;
                tris[k + 5] = cy11;
            }
        }

        let positions = new Float32Array(v.flat());
        let texcoords = new Float32Array(t.flat());
        let normals   = new Float32Array(n.flat());
        let indices = new Uint32Array(tris);

        return new Mesh([new Primitive(positions, texcoords, normals, indices)]);
    }
}