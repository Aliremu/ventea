export declare class CommandBuffer {
    private arr;
    constructor();
    push(fn: Function): void;
    pop(): Function | undefined;
    peek(): Function;
    clear(): void;
    get length(): number;
    [Symbol.iterator](): {
        next: () => {
            value: Function;
            done: boolean;
        };
    };
}
