export enum Wrap {
    Repeat,
    Clamp
}

export enum SamplerFilter {
    Nearest,
    Linear
}

export interface Sampler {
    wrapS: Wrap,
    wrapT: Wrap,
    minFilter: SamplerFilter;
    magFilter: SamplerFilter;
    mip: boolean;
}