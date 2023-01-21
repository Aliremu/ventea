export class Ref<T> {
    public impl: T;

    constructor(impl: T) {
        this.impl = impl;
    }

    as<T>(): T {
        return this.impl as unknown as T;
    }
}