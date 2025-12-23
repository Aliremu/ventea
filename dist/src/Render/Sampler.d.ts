export declare enum Wrap {
    Repeat = 0,
    Clamp = 1
}
export declare enum SamplerFilter {
    Nearest = 0,
    Linear = 1
}
export interface Sampler {
    wrapS: Wrap;
    wrapT: Wrap;
    minFilter: SamplerFilter;
    magFilter: SamplerFilter;
    mip: boolean;
}
