import { createWorld, addEntity } from "../lib/bitECS/index.mjs";
import { Entity } from "./Entity.js";

export class Scene {
    world;

    constructor() {
        this.world = createWorld();

        Physics.set({
            scene: this
        });
    }

    createEntity(name) {
        let handle = addEntity(this.world);
        let entity = new Entity(handle, this);

        return entity;
    }

    run(time) {
    }
}