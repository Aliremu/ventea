export interface IShader {
    vertSrc: string;
    fragSrc: string;
    vertex: Map<string, any>;
}
export declare class Shader {
    _impl: IShader;
    constructor(vertSrc: string, fragSrc: string);
    as<T>(): T;
}
