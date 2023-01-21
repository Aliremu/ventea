import { Camera } from "../Camera/Camera";
import { Scene } from "../Scene/Scene";
export declare abstract class RendererAPI {
    abstract beginRenderPass(time: number, camera: Camera): void;
    abstract endRenderPass(): void;
    abstract renderScene(scene: Scene, time: number, camera: Camera): void;
    abstract drawIndexed(size: number): void;
    abstract resize(width: number, height: number): void;
}
