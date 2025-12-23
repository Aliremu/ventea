import { IWorld } from "bitecs";
import { Entity } from "./Entity";
import { Texture2D } from "../Render/Texture2D";
export declare class Scene {
    world: IWorld;
    pool: Array<Entity>;
    renderableList: Array<number>;
    background: Texture2D;
    constructor();
    createEntity(name?: string): Entity;
    removeEntity(entity: Entity): void;
    getEntityFromHandle(eid: number): Entity;
}
