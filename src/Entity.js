import { addComponent } from "../lib/bitECS/index.mjs";

export class Entity {
    handle = 0;
    scene = null;

    constructor(handle, scene) {
        this.handle = handle;
        this.scene = scene;
    }

    addComponent(component) {
        addComponent(this.scene.world, component, this.handle);
    }
}