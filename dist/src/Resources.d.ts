import { Resource } from './Resource';
export declare class Resources {
    static resources: Map<number, Resource<unknown>>;
    static load<T>(type: T, uri: string): Promise<T>;
    static get<T extends Resource<T>>(handle: number): T;
    static add<T>(handle: number, resource: Resource<T>): void;
}
