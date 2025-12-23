import { Sampler, SamplerFilter, Wrap } from "../Sampler";
import { ITexture2D } from "../Texture2D";
import { TextureFormat } from "../TextureFormat";
import { WebGLContext } from "./WebGLContext";

const getFilter = (gl: WebGL2RenderingContext, filter: SamplerFilter): number => {
    if(filter == SamplerFilter.Nearest) 
        return gl.NEAREST;
    else
        return gl.LINEAR;
}

const getWrap = (gl: WebGL2RenderingContext, wrap: Wrap): number => {
    if(wrap == Wrap.Repeat) 
        return gl.REPEAT;
    else
        return gl.CLAMP_TO_EDGE;
}

const getInternalFormat = (gl: WebGL2RenderingContext, format: TextureFormat): number => {
    switch(format) {
        case TextureFormat.BGRA8SRGB: return gl.RGBA;
        case TextureFormat.BGRA8UNORM: return gl.RGBA;
        case TextureFormat.RGBA32F: return gl.RGBA32F;
    }
}

const getFormat = (gl: WebGL2RenderingContext, format: TextureFormat): number => {
    switch(format) {
        case TextureFormat.BGRA8SRGB: return gl.RGBA;
        case TextureFormat.BGRA8UNORM: return gl.RGBA;
        case TextureFormat.RGBA32F: return gl.RGBA;
    }
}

const getType = (gl: WebGL2RenderingContext, format: TextureFormat): number => {
    switch(format) {
        case TextureFormat.BGRA8SRGB: return gl.UNSIGNED_BYTE;
        case TextureFormat.BGRA8UNORM: return gl.UNSIGNED_BYTE;
        case TextureFormat.RGBA32F: return gl.FLOAT;
    }
}

export class WebGLTexture2D implements ITexture2D {
    public texture: number;

    // static FORMAT_MAP: Map<TextureFormat, GPUTextureFormat> = new Map<TextureFormat, GPUTextureFormat>([
    //     [TextureFormat.BGRA8UNORM, 'bgra8unorm'],
    //     [TextureFormat.BGRA8SRGB, 'bgra8unorm-srgb']
    // ]);

    constructor(public width: number, public height: number, public format: TextureFormat, public options: Sampler) {
        const gl = WebGLContext.gl;

        const texture = gl.createTexture();

        gl.bindTexture(gl.TEXTURE_2D, texture);

        /*const wrap = options.wrap ?? gl.REPEAT;
        const filter = options.filter ?? gl.LINEAR;
        const internalFormat = options.internalFormat ?? gl.SRGB8_ALPHA8;
        const format = options.format ?? gl.RGBA;
        const type = options.type ?? gl.UNSIGNED_BYTE;*/

        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, getWrap(gl, options.wrapS));
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, getWrap(gl, options.wrapT));
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, options.mip ? gl.LINEAR_MIPMAP_LINEAR : getFilter(gl, options.minFilter));
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, getFilter(gl, options.magFilter));

        const data = new Uint8Array(width * height * 4).fill(0xFF);

        // gl.texStorage2D(gl.TEXTURE_2D, 0, getInternalFormat(gl, format), width, height);
        gl.texImage2D(gl.TEXTURE_2D, 0, getInternalFormat(gl, format), width, height, 0, getFormat(gl, format), getType(gl, format), data);

        gl.bindTexture(gl.TEXTURE_2D, null);

        this.texture = texture as number;
    }

    resize(width: number, height: number): void {
        const gl = WebGLContext.gl;
        gl.bindTexture(gl.TEXTURE_2D, this.texture);
        const data = new Uint8Array(width * height * 4).fill(0xFF);
        this.width = width;
        this.height = height;

        gl.texImage2D(gl.TEXTURE_2D, 0, getInternalFormat(gl, this.format), width, height, 0, getFormat(gl, this.format), getType(gl, this.format), data);
        gl.bindTexture(gl.TEXTURE_2D, null);
    }

    setData(data: Uint8Array | Float32Array | ImageBitmap): void {
        const gl = WebGLContext.gl;
        gl.bindTexture(gl.TEXTURE_2D, this.texture);
        
        if (data instanceof Uint8Array) {
            gl.texImage2D(gl.TEXTURE_2D, 0, getInternalFormat(gl, this.format), this.width, this.height, 0, getFormat(gl, this.format), getType(gl, this.format), data);
        } else if(data instanceof Float32Array) {
            gl.texImage2D(gl.TEXTURE_2D, 0, getInternalFormat(gl, this.format), this.width, this.height, 0, getFormat(gl, this.format), getType(gl, this.format), data);
        } else {
            gl.texImage2D(gl.TEXTURE_2D, 0, getInternalFormat(gl, this.format), this.width, this.height, 0, getFormat(gl, this.format), getType(gl, this.format), data);
        }
        
        if (this.options.mip) {
            gl.generateMipmap(gl.TEXTURE_2D);
        }

        gl.bindTexture(gl.TEXTURE_2D, null);
    }
}