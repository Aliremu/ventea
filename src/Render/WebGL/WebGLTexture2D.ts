import { ITexture2D } from "../Texture2D";
import { TextureFormat } from "../TextureFormat";
import { WebGLContext } from "./WebGLContext";

export class WebGLTexture2D implements ITexture2D {
    public texture: number;

    // static FORMAT_MAP: Map<TextureFormat, GPUTextureFormat> = new Map<TextureFormat, GPUTextureFormat>([
    //     [TextureFormat.BGRA8UNORM, 'bgra8unorm'],
    //     [TextureFormat.BGRA8SRGB, 'bgra8unorm-srgb']
    // ]);

    constructor(public width: number, public height: number, public format: TextureFormat, public mip: boolean) {
        const gl = WebGLContext.gl;

        const texture = gl.createTexture();

        gl.bindTexture(gl.TEXTURE_2D, texture);

        /*const wrap = options.wrap ?? gl.REPEAT;
        const filter = options.filter ?? gl.LINEAR;
        const internalFormat = options.internalFormat ?? gl.SRGB8_ALPHA8;
        const format = options.format ?? gl.RGBA;
        const type = options.type ?? gl.UNSIGNED_BYTE;*/

        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, this.mip ? gl.LINEAR_MIPMAP_LINEAR : gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

        const data = new Uint8Array(width * height * 4).fill(0xFF);

        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, data);

        this.texture = texture as number;
    }

    setData(data: Uint8Array | ImageBitmap): void {
        const gl = WebGLContext.gl;
        if (data instanceof Uint8Array) {
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, this.width, this.height, 0, gl.RGBA, gl.UNSIGNED_BYTE, data);
        } else {
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, this.width, this.height, 0, gl.RGBA, gl.UNSIGNED_BYTE, data);
        }
        
        if (this.mip) {
            gl.generateMipmap(gl.TEXTURE_2D);
        }
    }
}