import { ComponentType } from "bitecs";
import { Vector3Proxy } from "./Components";
import { Scene } from "./Scene";
declare class PositionProxy extends Vector3Proxy {
    constructor(eid: number);
    get x(): number;
    set x(val: number);
    get y(): number;
    set y(val: number);
    get z(): number;
    set z(val: number);
}
declare class RotationProxy extends Vector3Proxy {
    constructor(eid: number);
}
declare class ScaleProxy extends Vector3Proxy {
    constructor(eid: number);
}
export declare class Entity {
    handle: number;
    scene: Scene;
    position: PositionProxy;
    rotation: RotationProxy;
    scale: ScaleProxy;
    name: string;
    isVisible: boolean;
    constructor(handle: number, scene: Scene);
    addComponent(component: ComponentType<any>, data?: any): Entity;
    setComponent(component: ComponentType<any>, data: any): void;
    getComponent<T>(component: ComponentType<any>): Vector3Proxy | undefined;
}
export {};
