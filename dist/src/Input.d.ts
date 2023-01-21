export declare class Input {
    static KEY_MAP: Map<string, boolean>;
    static MOUSE_MAP: Map<number, boolean>;
    static MOUSE_X: number;
    static MOUSE_Y: number;
    static MOUSE_DELTA_X: number;
    static MOUSE_DELTA_Y: number;
    static init(): void;
    static isKeyDown(key: string): boolean | undefined;
    static isMouseDown(mouse: number): boolean | undefined;
    static getMouseX(): number;
    static getMouseY(): number;
    static getMouseDeltaX(): number;
    static getMouseDeltaY(): number;
}
