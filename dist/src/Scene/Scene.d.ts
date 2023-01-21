import { IWorld } from "bitecs";
import { Entity } from "./Entity";
export declare class Scene {
    world: IWorld;
    pool: Array<Entity>;
    renderableList: Array<number>;
    constructor();
    createEntity(name?: string): Entity;
    removeEntity(entity: Entity): void;
    getEntityFromHandle(eid: number): Entity;
}
