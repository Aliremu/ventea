import { Vector2, Vector3 } from "../Math/Vector";
import { BodyType } from "./BodyType";
import { Shape } from "./Shape";
export interface CreateBodyDesc {
    shape?: Shape;
    type?: BodyType;
    position?: Vector3;
    rotation?: Vector3;
    scale?: Vector3 | Vector2 | number;
    density?: number;
    friction?: number;
    restitution?: number;
    name?: string;
    eid?: number;
    mesh?: CreateMeshDesc;
}
export interface SubMeshDesc {
    indexCount: number;
    baseIndex: number;
    baseVertex: number;
}
export interface CreateMeshDesc {
    vertices: Float32Array;
    indices: Uint32Array;
    subMeshes: SubMeshDesc[];
}
