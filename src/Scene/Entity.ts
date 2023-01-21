import { addComponent, ComponentType, hasComponent } from "bitecs";
import { Vector2, Vector3 } from "../Math/Vector";
import { Mesh } from "../Mesh/Mesh";
import { BodyType } from "../Physics/BodyType";
import { Physics } from "../Physics/Physics";
import { CreateBodyDesc, CreateMeshDesc, SubMeshDesc } from "../Physics/PhysicsEnums";
import { Shape } from "../Physics/Shape";
import { Resource } from "../Resource";
import { Resources } from "../Resources";
import { BoxCollider, CapsuleCollider, LastPosition, Light, MeshCollider, MeshRenderer, Position, RigidBody, Rotation, Scale, SphereCollider, Vector3Proxy, Velocity } from "./Components";
import { Scene } from "./Scene";

class Vector4Proxy {
    private store: ComponentType<any>;
    private eid: number;

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
    get w() { return this.store.w[this.eid] }
    set w(val: number) { this.store.w[this.eid] = val }

    set(x: number, y: number, z: number, w: number) {
        this.store.x[this.eid] = x;
        this.store.y[this.eid] = y;
        this.store.z[this.eid] = z;
        this.store.w[this.eid] = w;
    }
}

class PositionProxy extends Vector3Proxy {
    constructor(eid: number) {
        super(Position, eid);
    }

    get x() {
        return super.x;
    }

    set x(val) {
        LastPosition.x[this.eid] = super.x;
        super.x = val;
        //console.log("SETTING X: " + val);
    }

    get y() {
        return super.y;
    }

    set y(val) {
        LastPosition.y[this.eid] = super.y;
        super.y = val;
    }

    get z() {
        return super.z;
    }

    set z(val) {
        LastPosition.z[this.eid] = super.z;
        super.z = val;
    }
}

class RotationProxy extends Vector3Proxy {
    constructor(eid: number) { super(Rotation, eid) }
}

class ScaleProxy extends Vector3Proxy {
    constructor(eid: number) { super(Scale, eid) }
}

export class Entity {
    public handle: number;
    public scene: Scene;

    //lastPosition = null;
    public position: PositionProxy;
    public rotation: RotationProxy;
    public scale: ScaleProxy;
    public name: string = '';
    public isVisible: boolean = true;

    constructor(handle: number, scene: Scene) {
        this.handle = handle;
        this.scene = scene;
        this.position = new PositionProxy(handle);
        this.rotation = new RotationProxy(handle);
        this.scale = new ScaleProxy(handle);
    }

    addComponent(component: ComponentType<any>, data: any = null): Entity {
        switch (component) {
            case Light: {
                addComponent(this.scene.world, component, this.handle);
                Light.color.x[this.handle] = data.r;
                Light.color.y[this.handle] = data.g;
                Light.color.z[this.handle] = data.b;
                Light.type[this.handle] = data.type;

                break;
            }

            case MeshRenderer: {
                addComponent(this.scene.world, component, this.handle);
                // MeshRenderer.resourceId[this.handle] = Resources.hashCode((data as Mesh).handle);
                const uuid = (data as Resource<Mesh>).handle;
                MeshRenderer.assetId[this.handle] = uuid;
                this.scene.renderableList.push(this.handle);
                break;
            }

            case MeshCollider: {
                addComponent(this.scene.world, component, this.handle);
                const uuid = (data as Resource<Mesh>).handle;
                MeshCollider.assetId[this.handle] = uuid;
                break;
            }

            case RigidBody: {
                if(!Physics.isReady) break;

                let o: CreateBodyDesc = {};

                if (hasComponent(this.scene.world, BoxCollider, this.handle)) {
                    o.shape = Shape.Box;
                    o.scale = new Vector3(BoxCollider.x[this.handle], BoxCollider.y[this.handle], BoxCollider.z[this.handle]);
                }

                if (hasComponent(this.scene.world, SphereCollider, this.handle)) {
                    o.shape = Shape.Sphere;
                    o.scale = SphereCollider.radius[this.handle];
                }

                if (hasComponent(this.scene.world, CapsuleCollider, this.handle)) {
                    o.shape = Shape.Capsule;
                    o.scale = new Vector2(CapsuleCollider.radius[this.handle], CapsuleCollider.halfHeight[this.handle]);
                }

                o.position = new Vector3(Position.x[this.handle], Position.y[this.handle], Position.z[this.handle]);
                o.rotation = new Vector3(Rotation.x[this.handle], Rotation.y[this.handle], Rotation.z[this.handle]);
                o.density = data.density ?? 1;
                o.friction = data.friction ?? 0.5;
                o.restitution = data.restitution ?? 0.2;
                o.type = data.type ?? BodyType.Dynamic;
                o.eid = this.handle;

                RigidBody.shape[this.handle] = o.shape!;
                RigidBody.type[this.handle] = o.type!;
                RigidBody.restitution[this.handle] = o.restitution!;
                RigidBody.friction[this.handle] = o.friction!;

                if (hasComponent(this.scene.world, MeshCollider, this.handle)) {
                    o.shape = Shape.Mesh;
                    o.scale = new Vector3(Scale.x[this.handle], Scale.y[this.handle], Scale.z[this.handle]);

                    const mesh = Resources.get<Mesh>(MeshCollider.assetId[this.handle]);
                    const subMeshes: SubMeshDesc[] = [];
                    for(const subMesh of mesh.subMeshes) {
                        subMeshes.push({
                            baseVertex: subMesh.baseVertex,
                            baseIndex: subMesh.baseIndex,
                            indexCount: subMesh.indexCount,
                        });
                    }
                    const meshDesc: CreateMeshDesc = {
                        vertices: mesh.positionBuffer.data,
                        indices: mesh.indexBuffer.data,
                        subMeshes: subMeshes
                    };

                    o.mesh = meshDesc;

                    Physics.post({ m: 'create', o: o });
                    return this;
                }

                Physics.post({ m: 'create', o: o });
            }

            default: {
                addComponent(this.scene.world, component, this.handle);
                this.setComponent(component, data);
                break;
            }
        }

        return this;
    }

    setComponent(component: ComponentType<any>, data: any) {
        for (const key in data) {
            component[key][this.handle] = data[key];
        }
    }

    getComponent<T>(component: ComponentType<any>) {
        switch(component) {
            case Velocity: {
                return new Vector3Proxy(Velocity, this.handle);
            }
        }
    }
}