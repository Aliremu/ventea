export class Input {
    static KEY_MAP: Map<string, boolean> = new Map();
    
    static MOUSE_MAP: Map<number, boolean> = new Map();

    static MOUSE_X: number = 0;
    static MOUSE_Y: number = 0;

    static MOUSE_DELTA_X: number = 0;
    static MOUSE_DELTA_Y: number = 0;

    static init() {
        document.addEventListener('mousedown', (e) => {
            if(!document.pointerLockElement) return;
            
            Input.MOUSE_MAP.set(e.button, true);
        });

        document.addEventListener('mouseup', (e) => {
            if(!document.pointerLockElement) return;

            Input.MOUSE_MAP.set(e.button, false);
        });

        document.addEventListener('mousemove', (e) => {
            if(!document.pointerLockElement) return;

            Input.MOUSE_X = e.clientX;
            Input.MOUSE_Y = e.clientY;

            Input.MOUSE_DELTA_X = e.movementX;
            Input.MOUSE_DELTA_Y = e.movementY;
        });

        document.addEventListener('keydown', (e) => {
            Input.KEY_MAP.set(e.code, true);
        });

        document.addEventListener('keyup', (e) => {
            Input.KEY_MAP.set(e.code, false);
        });
    }

    static isKeyDown(key: string) {
        return Input.KEY_MAP.get(key);
    }

    static isMouseDown(mouse: number) {
        return Input.MOUSE_MAP.get(mouse);
    }

    static getMouseX() {
        return Input.MOUSE_X;
    }

    static getMouseY() {
        return Input.MOUSE_Y;
    }

    static getMouseDeltaX() {
        return Input.MOUSE_DELTA_X;
    }

    static getMouseDeltaY() {
        return Input.MOUSE_DELTA_Y;
    }
}