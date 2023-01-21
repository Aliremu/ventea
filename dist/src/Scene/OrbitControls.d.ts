import { Camera } from "../Camera/Camera";
import { Vector3 } from "../Math/Vector";
export declare class OrbitControls {
    camera: Camera;
    mouseDown: boolean;
    distance: number;
    private yaw;
    private pitch;
    target: Vector3;
    constructor(camera: Camera);
    update(): void;
}
