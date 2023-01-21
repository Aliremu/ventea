export namespace Utils {
    export const lerp = (a: number, b: number, t: number) => {
        return a * (1 - t) + b * t;
    }

    export const clamp = (val: number, min: number, max: number) => {
        return Math.min(Math.max(val, min), max);
    }

    export const DEG_TO_RAD = Math.PI / 180;
    export const RAD_TO_DEG = 180 / Math.PI;
}