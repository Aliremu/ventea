export interface IShader {
    vertSrc: string;
    fragSrc: string;
    vertexAttributes: Map<string, any>;
    setInt(name: string, val: number): void;
    setFloat(name: string, val: number): void;
    setVec2(name: string, val: Float32List): void;
    setVec3(name: string, val: Float32List): void;
    setVec4(name: string, val: Float32List): void;
    setMat3(name: string, val: Float32List): void;
    setMat4(name: string, val: Float32List): void;
}
export declare class Shader {
    _impl: IShader;
    constructor(name: string, vertSrc: string, fragSrc: string);
    static find(name: string): Shader;
    static get REGISTRY(): Map<string, Shader>;
    as<T>(): T;
}
