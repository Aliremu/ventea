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
import { MeshRenderer, BoxCollider, SphereCollider, RigidBody, MeshCollider, Velocity, Position, LastPosition, CapsuleCollider, Light } from "./Scene/Components";
import * as math from 'gl-matrix';
import { Vector2, Vector3, Vector4 } from "./Math/Vector";
import { Utils } from "./Math/Utils";
import { Input } from "./Input";
import { ComputeBuffer } from "./Render/ComputeBuffer";
import { ComputeShader } from "./Render/ComputeShader";
import { UniformBuffer } from "./Render/UniformBuffer";
import { CapsuleMesh } from "./Mesh/CapsuleMesh";
import { LightType } from "./Enums/LightType";
import { LightCreateInfo } from "./Interfaces/LightCreateInfo";
interface InitEngineDesc {
    api?: API;
    physics?: boolean;
}
declare class Engine {
    canvas: HTMLCanvasElement;
    constructor(canvas: HTMLCanvasElement);
    init(settings?: InitEngineDesc): Promise<void[]>;
}
declare const test: (size: number) => void;
export { InitEngineDesc, Engine, Renderer, API, Physics, LightType, LightCreateInfo, Vector2, Vector3, Vector4, Utils, Input, Scene, Entity, Resource, Resources, PerspectiveCamera, OrthographicCamera, FirstPersonControls, OrbitControls, Texture2D, VideoTexture, Mesh, GLTFMesh, GridMesh, PlaneMesh, BoxMesh, SphereMesh, CapsuleMesh, MeshRenderer, BoxCollider, SphereCollider, MeshCollider, CapsuleCollider, RigidBody, Velocity, Position, LastPosition, Light, ComputeBuffer, ComputeShader, UniformBuffer, Shape, BodyType, math, test };
