import { Vector3Proxy } from '../Scene/Components';
import { Vector3 } from "../Math/Vector";
export declare class Physics {
    static isReady: boolean;
    static frameTime: number;
    static message(m: any): void;
    static post(e: any, buffer?: any): void;
    static init(o?: {}): Promise<void>;
    static set(o?: any): void;
    static step(o?: any): void;
    static get lastTime(): number;
    static get bodies(): any;
    static get controller(): any[];
    static setLinearVelocity(entity: number, velocity: Vector3): void;
    static setAngularVelocity(entity: number, velocity: Vector3): void;
    static setPosition(entity: number, position: Vector3): void;
    static addForce(entity: number, force: Vector3): void;
    static raycast(origin: Vector3 | Vector3Proxy, direction: Vector3, distance: number, callback: any): void;
    static doneRaycast(o?: any): void;
    static lockRotation(eid: number): void;
    static removeBody(o?: {}): void;
    static addedEntity(o?: {}): void;
    static addController(o?: {}): void;
    static ready(): void;
}
