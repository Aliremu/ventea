import { API, Renderer } from "./Render/Renderer";
import { PerspectiveCamera } from './Camera/PerspectiveCamera';
import { OrthographicCamera } from './Camera/OrthographicCamera';

import { Physics } from "./Physics/Physics";
import { BodyType } from "./Physics/BodyType";
import { Shape } from "./Physics/Shape";

import { Scene } from "./Scene/Scene";
import { Entity } from "./Scene/Entity";
import { Resources } from "./Resources";
import { Resource } from "./Resource";

import { Texture2D } from "./Render/Texture2D";
import { VideoTexture } from "./Render/VideoTexture";

import { Mesh } from "./Mesh/Mesh";
import { GLTFMesh } from "./Mesh/GLTFMesh";
import { GridMesh } from "./Mesh/GridMesh";
import { PlaneMesh } from "./Mesh/PlaneMesh";
import { BoxMesh } from "./Mesh/BoxMesh";
import { SphereMesh } from "./Mesh/SphereMesh";

import { OrbitControls } from "./Scene/OrbitControls";
import { FirstPersonControls } from "./Scene/FirstPersonControls";

import { MeshRenderer, BoxCollider, SphereCollider, RigidBody, MeshCollider, Velocity, Position, LastPosition, TestComponent, CapsuleCollider, Light } from "./Scene/Components";

// import * as math from 'wgpu-matrix';
import * as math from 'gl-matrix';

import { Vector2, Vector3, Vector4 } from "./Math/Vector";
import { Utils } from "./Math/Utils";
import { Input } from "./Input";
import { addComponent, addEntity, createWorld, defineQuery, deleteWorld, registerComponent, resetWorld, setDefaultSize } from "bitecs";
import { ComputeBuffer } from "./Render/ComputeBuffer";
import { ComputeShader } from "./Render/ComputeShader";
import { UniformBuffer } from "./Render/UniformBuffer";
import { CapsuleMesh } from "./Mesh/CapsuleMesh";
import { LightType } from "./Enums/LightType";

import { LightCreateInfo } from "./Interfaces/LightCreateInfo";

// math.setDefaultType(Array);

interface InitEngineDesc {
    api?: API;
    physics?: boolean
};

class Engine {
    canvas: HTMLCanvasElement;

    constructor(canvas: HTMLCanvasElement) {
        this.canvas = canvas;
    }

    init(settings?: InitEngineDesc) {
        const api: API = settings?.api ?? API.WebGPU;
        const physics: boolean = settings?.physics ?? true;

        let inits = [];

        inits.push(Input.init());
        inits.push(Renderer.init(this.canvas, api));
        if(physics) inits.push(Physics.init());

        return Promise.all(inits);
    }
}

const test = (size: number) => {
    let i = 0;

    let test = new Array(size);
    for(let j = 0; j < size; j++) {
        test[j] = new Vector3();
    }

    const startArr = console.time("ARR");
    for(const vec of test) {
        vec.x = i * 2;
        vec.y = i * 2;
        vec.z = i * 2;
        i++;
    }
    const endArr = console.timeEnd("ARR");
    console.log("ARR: ", test[size-1].x);

    // setDefaultSize(100000);
    
    const world = createWorld(size);
    registerComponent(world, TestComponent);
    for(let j = 0; j < size; j++) {
        const ent = addEntity(world);
        addComponent(world, TestComponent, ent);
    }

    i = 0;
    const query = defineQuery([TestComponent]);
    const result = query(world);
    const startECS = console.time("ECS");
    for(const e of result) {
        TestComponent.x[e] = i * 2;
        TestComponent.y[e] = i * 2;
        TestComponent.z[e] = i * 2;
        i++;
    }
    const endECS = console.timeEnd("ECS");
    console.log("ECS: ", TestComponent.x[size-1]);


    // const timeArr = endArr - startArr;
    // const timeECS = endECS - startECS;

    // const diff = (timeArr - timeECS) / timeArr;

    // console.log(`ARR: ${timeArr}ms, ECS: ${timeECS}ms, Diff: ${diff}%`);
}

export {
    InitEngineDesc,
    Engine,
    Renderer,
    API,
    Physics,

    LightType,

    LightCreateInfo,

    Vector2, 
    Vector3, 
    Vector4,
    Utils,
    Input,

    Scene,
    Entity,
    Resource,
    Resources,

    PerspectiveCamera,
    OrthographicCamera,
    FirstPersonControls,
    OrbitControls,

    Texture2D,
    VideoTexture,

    Mesh,
    GLTFMesh,
    GridMesh,
    PlaneMesh,
    BoxMesh, 
    SphereMesh,
    CapsuleMesh,

    MeshRenderer,
    BoxCollider,
    SphereCollider,
    MeshCollider,
    CapsuleCollider,
    RigidBody,
    Velocity,
    Position,
    LastPosition,
    Light,

    ComputeBuffer,
    ComputeShader,
    UniformBuffer,

    Shape,
    BodyType,

    math,
    test
};