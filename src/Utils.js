const clamp = (num, min, max) => Math.min(Math.max(num, min), max);
const lerp = (a, b, t) => (1 - t) * a + t * b;

export class Utils {
    static clamp = (num, min, max) => Math.min(Math.max(num, min), max);
    static lerp = (a, b, t) => (1 - t) * a + t * b;
}