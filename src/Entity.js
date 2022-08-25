import { addComponent, hasComponent } from "../lib/bitECS/index.mjs";
import { AssetManager } from "./AssetManager.js";
import { BoxCollider, MeshCollider, MeshRenderer, Position, RigidBody, Rotation, Size, SphereCollider, Tag } from "./Components.js";
import { Physics } from "./Physics.js";
import { Cube } from "./Ventea.js";

class Vector3Proxy {
    constructor(store, eid) {
        this.eid = eid
        this.store = store
    }
    get x() { return this.store.x[this.eid] }
    set x(val) { this.store.x[this.eid] = val }
    get y() { return this.store.y[this.eid] }
    set y(val) { this.store.y[this.eid] = val }
    get z() { return this.store.z[this.eid] }
    set z(val) { this.store.z[this.eid] = val }
}

class Vector4Proxy {
    constructor(store, eid) {
        this.eid = eid
        this.store = store
    }
    get x() { return this.store.x[this.eid] }
    set x(val) { this.store.x[this.eid] = val }
    get y() { return this.store.y[this.eid] }
    set y(val) { this.store.y[this.eid] = val }
    get z() { return this.store.z[this.eid] }
    set z(val) { this.store.z[this.eid] = val }
    get w() { return this.store.w[this.eid] }
    set w(val) { this.store.w[this.eid] = val }
}

class PositionProxy extends Vector3Proxy {
    constructor(eid) { super(Position, eid) }
}

class RotationProxy extends Vector4Proxy {
    constructor(eid) { super(Rotation, eid) }
}

class SizeProxy extends Vector3Proxy {
    constructor(eid) { super(Size, eid) }
}

export class Entity {
    handle = 0;
    scene = null;

    lastPosition = null;
    position = null;
    rotation = null;
    size = null;

    constructor(handle, scene) {
        this.handle = handle;
        this.scene = scene;
        this.position = new PositionProxy(handle);
        this.rotation = new RotationProxy(handle);
        this.size = new SizeProxy(handle);
    }

    addComponent(component, data = null) {
        addComponent(this.scene.world, component, this.handle);

        if(data == null) return;

        switch(component) {
            case MeshRenderer: {
                this.setComponent(component, { resourceId: data.assetId });
                break;
            }

            case MeshCollider: {
                this.setComponent(component, { resourceId: data.assetId });
                break;
            }

            case RigidBody: {
                let size = [Size.x[this.handle], Size.y[this.handle], Size.z[this.handle]];
                let shape = 'box';

                if(hasComponent(this.scene.world, BoxCollider, this.handle)) {
                    shape = 'box';
                    size = [BoxCollider.x[this.handle], BoxCollider.y[this.handle], BoxCollider.z[this.handle]];
                }

                if(hasComponent(this.scene.world, SphereCollider, this.handle)) {
                    shape = 'sphere';
                    size = [SphereCollider.radius[this.handle], SphereCollider.radius[this.handle], SphereCollider.radius[this.handle]];
                }

                let o = {
                    eid:  this.handle,
                    shape: shape,
                    pos:  [Position.x[this.handle], Position.y[this.handle], Position.z[this.handle]],
                    rot:  [Rotation.x[this.handle], Rotation.y[this.handle], Rotation.z[this.handle], Rotation.w[this.handle]],
                    size: size,
                    density: data.density ?? 1,
                    friction: data.friction ?? 0.5,
                    restitution: data.restitution ?? 0.2,
                    type: data.type ?? 'dynamic',
                    name: Tag.tag[this.handle]
                };

                if(hasComponent(this.scene.world, MeshCollider, this.handle)) {
                    o.shape = 'mesh';
                    const primitives = AssetManager.ASSETS[MeshCollider.resourceId[this.handle]].primitives;
                    for(const p of primitives) {
                        o.vertices = p.positions;
                        o.indices = p.indices;
                        //if(p.positions.length == 0) continue;

                        Physics.post({ m:'add', o:o }, [p.positions.buffer, p.indices.buffer]);
                    }
                    break;
                }

                Physics.post({ m:'add', o:o });
                break;
            }
            default: {
                this.setComponent(component, data);
                break;
            }
        }
    }

    setComponent(component, data) {
        for (const key in data) {
            component[key][this.handle] = data[key];
        }
    }
}