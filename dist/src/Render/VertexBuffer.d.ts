export interface IVertexBuffer {
    data: Float32Array;
    size: number;
    setData(data: Float32Array): void;
}
export declare class VertexBuffer {
    _impl: IVertexBuffer;
    constructor(data: Float32Array, size: number);
    get data(): Float32Array;
    get size(): number;
    setData(data: Float32Array): void;
    as<T>(): T;
}
