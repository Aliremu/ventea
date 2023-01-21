import { createWorld, addEntity, removeEntity, hasComponent, IWorld } from "bitecs";
import { LastPosition, MeshRenderer, Position, RigidBody, Rotation, Scale, Tag } from "./Components";
import { Entity } from "./Entity";
import { Physics } from "../Physics/Physics";
import { UUID } from "../Core/UUID";

export class Scene {
    public world: IWorld;
    public pool: Array<Entity>;
    public renderableList: Array<number>;

    constructor() {
        this.world = createWorld();
        this.pool = new Array();

        //TODO: Memoize query
        this.renderableList = new Array();

        if(Physics.isReady)
            Physics.set({ scene: this });
    }

    createEntity(name?: string) {
        const uuid = UUID.generateUUID();
        name = name ?? uuid.toString();

        const handle = addEntity(this.world);
        const entity = new Entity(handle, this);
        entity.name = name;

        entity.addComponent(Tag, { uuid: uuid });
        entity.addComponent(Position, { x: 0, y: 0, z: 0 });
        entity.addComponent(LastPosition, { x: 0, y: 0, z: 0 });
        entity.addComponent(Rotation, { x: 0, y: 0, z: 0 });
        entity.addComponent(Scale, { x: 1, y: 1, z: 1 });

        this.pool[handle] = entity;

        return entity;
    }

    removeEntity(entity: Entity) {
        if(hasComponent(this.world, RigidBody, entity.handle)) {
            //Physics.removeBody({ eid: entity.handle });
        }

        delete this.pool[entity.handle];

        removeEntity(this.world, entity.handle);
    }

    getEntityFromHandle(eid: number): Entity {
        return this.pool[eid];
    }
}