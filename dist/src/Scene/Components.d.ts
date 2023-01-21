import { ComponentType } from 'bitecs';
export declare const Vector3: {
    x: "f32";
    y: "f32";
    z: "f32";
};
export declare const Vector4: {
    x: "f32";
    y: "f32";
    z: "f32";
    w: "f32";
};
export declare class Vector3Proxy {
    private store;
    eid: number;
    constructor(store: ComponentType<any>, eid: number);
    get x(): number;
    set x(val: number);
    get y(): number;
    set y(val: number);
    get z(): number;
    set z(val: number);
    set(x: number, y: number, z: number): void;
}
export declare const List: ComponentType<{
    values: ["f32", number];
}>;
export declare const Transform: ComponentType<{
    position: {
        x: "f32";
        y: "f32";
        z: "f32";
    };
    rotation: {
        x: "f32";
        y: "f32";
        z: "f32";
    };
    scale: {
        x: "f32";
        y: "f32";
        z: "f32";
    };
}>;
export declare const Position: ComponentType<{
    x: "f32";
    y: "f32";
    z: "f32";
}>;
export declare const Rotation: ComponentType<{
    x: "f32";
    y: "f32";
    z: "f32";
}>;
export declare const Scale: ComponentType<{
    x: "f32";
    y: "f32";
    z: "f32";
}>;
export declare const LastPosition: ComponentType<{
    x: "f32";
    y: "f32";
    z: "f32";
}>;
export declare const Velocity: ComponentType<{
    x: "f32";
    y: "f32";
    z: "f32";
}>;
export declare const Tag: ComponentType<{
    uuid: "ui32";
}>;
export declare const Reference: ComponentType<{
    entity: "eid";
}>;
export declare const MeshRenderer: ComponentType<{
    assetId: "ui32";
    castShadow: "ui8";
}>;
export declare const RigidBody: ComponentType<{
    shape: "i8";
    density: "f32";
    type: "i8";
    restitution: "f32";
    friction: "f32";
}>;
export declare const BoxCollider: ComponentType<{
    x: "f32";
    y: "f32";
    z: "f32";
}>;
export declare const SphereCollider: ComponentType<{
    radius: "f32";
}>;
export declare const CapsuleCollider: ComponentType<{
    radius: "f32";
    halfHeight: "f32";
}>;
export declare const MeshCollider: ComponentType<{
    assetId: "ui32";
    convex: "ui8";
}>;
export declare const Light: ComponentType<{
    color: {
        x: "f32";
        y: "f32";
        z: "f32";
    };
    type: "f32";
}>;
export declare const TestComponent: ComponentType<{
    x: "f32";
    y: "f32";
    z: "f32";
}>;
