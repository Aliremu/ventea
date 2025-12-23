import { ICamera } from "../Camera/ICamera";
import { Scene } from "../Scene/Scene";
export declare abstract class RendererAPI {
    abstract beginRenderPass(time: number, camera: ICamera): void;
    abstract endRenderPass(scene: Scene): void;
    abstract renderScene(scene: Scene, time: number, camera: ICamera): void;
    abstract drawIndexed(size: number): void;
    abstract resize(width: number, height: number): void;
}
