export class CommandBuffer {
    private arr: Array<Function>;

    constructor() {
        this.arr = [];
    }

    push(fn: Function) {
        this.arr.push(fn);
    }

    pop() {
        return this.arr.pop();
    }

    peek() {
        return this.arr[this.arr.length - 1];
    }

    clear() {
        this.arr.length = 0;
    }

    get length() {
        return this.arr.length;
    }

    [Symbol.iterator]() {
        let index = -1;
        let data  = this.arr;

        return {
            next: () => ({ value: data[++index], done: !(index in data) })
        };
    }
}