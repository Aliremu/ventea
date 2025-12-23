import { ICamera } from "../Camera/ICamera";
import { Vector3 } from "../Math/Vector";
export declare class OrbitControls {
    camera: ICamera;
    mouseDown: boolean;
    distance: number;
    private yaw;
    private pitch;
    target: Vector3;
    constructor(camera: ICamera);
    update(): void;
}
