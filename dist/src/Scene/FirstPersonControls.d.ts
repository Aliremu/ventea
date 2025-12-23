import { ICamera } from "../Camera/ICamera";
import { Vector3 } from "../Math/Vector";
import { Vector3Proxy } from "./Components";
export declare class FirstPersonControls {
    camera: ICamera;
    keys: Map<string, boolean>;
    lookDir: Vector3;
    yaw: number;
    pitch: number;
    target?: Vector3 | Vector3Proxy;
    constructor(camera: ICamera);
    update(): void;
}
