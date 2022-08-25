import {
    createWorld,
    Types,
    defineComponent,
    defineQuery,
    addEntity,
    addComponent,
    pipe,
  } from '../lib/bitECS/index.mjs';
  
  export const Vector3 = { x: Types.f32, y: Types.f32, z: Types.f32 }
  export const Vector4 = { x: Types.f32, y: Types.f32, z: Types.f32, w: Types.f32 }

  export const List = defineComponent({ values: [Types.f32, 3] });

  export const Position = defineComponent(Vector3);
  export const LastPosition = defineComponent(Vector3);
  
  export const Velocity = defineComponent(Vector3);
  export const Rotation = defineComponent(Vector4);
  export const Size = defineComponent(Vector3);

  export const Tag = defineComponent({ tag: Types.ui32 });
  export const Reference = defineComponent({ entity: Types.eid });

  export const MeshRenderer = defineComponent({ resourceId: Types.ui32 });

  export const RigidBody = defineComponent({ shape: Types.i8, density: Types.f32, type: Types.i8 });
  export const BoxCollider = defineComponent(Vector3);
  export const SphereCollider = defineComponent({ radius: Types.f32 });
  export const MeshCollider = defineComponent({ resourceId: Types.ui32 });

  export const DirectionalLight = defineComponent();