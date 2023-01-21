export interface IIndexBuffer {
    data: Uint32Array;
    size: number;
    setData(data: Uint32Array): void;
}
export declare class IndexBuffer {
    _impl: IIndexBuffer;
    constructor(data: Uint32Array, size: number);
    get data(): Uint32Array;
    get size(): number;
    setData(data: Uint32Array): void;
    as<T>(): T;
}
