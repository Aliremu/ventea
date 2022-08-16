import { glMatrix, mat2, mat3, mat4, vec2, vec3, vec4 } from '../lib/gl-matrix/index.js';
import { Surface } from './Surface.js';
import { Shader } from './Shader.js';
import { Camera } from './Camera.js';
import { Texture } from './Texture.js';
import { TextureManager } from './TextureManager.js';
import { Mesh } from './Mesh.js';
import { Cube } from './Cube.js';
import { Sphere } from './Sphere.js';
import { Controller } from './Controller.js';
import { Framebuffer } from './Framebuffer.js';
import { Physics } from './Physics.js';
import { Cubemap } from './Cubemap.js';
import { Capsule } from './Capsule.js';
import { Terrain } from './Terrain.js';
import { Scene } from "./Scene.js";
import { BlurPass } from './BlurPass.js';
import { BloomPass } from './BloomPass.js';
import { ShadowPass } from './ShadowPass.js';

import '../lib/gltf-loader/gltf-loader.js';
import { Renderer } from './Renderer.js';

const { GltfLoader } = window.GltfLoader;
window.glMatrix = glMatrix;
window.mat2 = mat2;
window.mat3 = mat3;
window.mat4 = mat4;
window.vec2 = vec2;
window.vec3 = vec3;
window.vec4 = vec4;

class Cartesian extends Float32Array {
    constructor(...args) {
        super(...args);
    }

    get x() { return this[0]; }
    get y() { return this[1]; }
    get z() { return this[2]; }
    get w() { return this[3]; }
    set x(val) { this[0] = val; }
    set y(val) { this[1] = val; }
    set z(val) { this[2] = val; }
    set w(val) { this[3] = val; }

    flatten() {
        if (this.length == 2) {
            return [this[0], this[1]];
        } else if (this.length == 3) {
            return [this[0], this[1], this[2]];
        }

        return [];
    }
}

glMatrix.setMatrixArrayType(Cartesian);

export class Ventea {
    scene = null;
    surface = null;

    constructor(surface, width, height) {
        this.surface = new Surface(surface);
        this.surface.resize(width, height);
    }

    async init() {
        await Texture.init();
        await Physics.init();

        window.Physics = Physics;
        Renderer.init();
    }

    bind(event, func) {
        this.surface.bind(event, func);
    }

    run(time) {
        this.scene.run(time);

        //requestAnimationFrame((time) => this.run(time));
    }
}

export { Mesh, Capsule, Cube, Sphere, Cubemap, Texture, Terrain, GltfLoader, Camera, Shader, Controller, Framebuffer, Scene, BlurPass, BloomPass, ShadowPass, Renderer };