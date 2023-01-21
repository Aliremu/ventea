import {
    createWorld,
    Types,
    defineComponent,
    defineQuery,
    addEntity,
    addComponent,
    pipe,
    ComponentType,
  } from 'bitecs';
  
  export const Vector3 = { x: Types.f32, y: Types.f32, z: Types.f32 }
  export const Vector4 = { x: Types.f32, y: Types.f32, z: Types.f32, w: Types.f32 }

  export class Vector3Proxy {
    private store: ComponentType<any>;
    public eid: number;

    constructor(store: ComponentType<any>, eid: number) {
        this.eid = eid
        this.store = store
    }
    get x() { return this.store.x[this.eid] }
    set x(val: number) { this.store.x[this.eid] = val }
    get y() { return this.store.y[this.eid] }
    set y(val: number) { this.store.y[this.eid] = val }
    get z() { return this.store.z[this.eid] }
    set z(val: number) { this.store.z[this.eid] = val }

    set(x: number, y: number, z: number) {
        this.store.x[this.eid] = x;
        this.store.y[this.eid] = y;
        this.store.z[this.eid] = z;
    }
}

  export const List = defineComponent({ values: [Types.f32, 3] });

  export const Transform = defineComponent({ position: Vector3, rotation: Vector3, scale: Vector3 });

  export const Position = defineComponent(Vector3);
  export const Rotation = defineComponent(Vector3);
  export const Scale = defineComponent(Vector3);

  export const LastPosition = defineComponent(Vector3);
  
  export const Velocity = defineComponent(Vector3);

  export const Tag = defineComponent({ uuid: Types.ui32 });
  export const Reference = defineComponent({ entity: Types.eid });

  export const MeshRenderer = defineComponent({ assetId: Types.ui32, castShadow: Types.ui8 });

  export const RigidBody = defineComponent({ shape: Types.i8, density: Types.f32, type: Types.i8, restitution: Types.f32, friction: Types.f32 });
  export const BoxCollider = defineComponent(Vector3);
  export const SphereCollider = defineComponent({ radius: Types.f32 });
  export const CapsuleCollider = defineComponent({ radius: Types.f32, halfHeight: Types.f32 });
  export const MeshCollider = defineComponent({ assetId: Types.ui32, convex: Types.ui8 });

  export const Light = defineComponent({ color: Vector3, type: Types.f32 });

  export const TestComponent = defineComponent(Vector3);