export declare abstract class IWrapper<T> {
    protected _impl: T | undefined;
    as<T>(): T;
}
