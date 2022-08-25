import { Resource } from "./Resource.js";
import { IMAGE } from "./Ventea.js";

export class Texture {
  #handle;
  static NO_TEXTURE;
  static NORMAL_TEXTURE;

  constructor(resource, options = {}) {
    const texture = gl.createTexture();

    gl.bindTexture(gl.TEXTURE_2D, texture);

    const wrap = options.wrap ?? gl.REPEAT;
    const filter = options.filter ?? gl.LINEAR;
    const internalFormat = options.internalFormat ?? gl.SRGB8_ALPHA8;
    const format = options.format ?? gl.RGBA;
    const type = options.type ?? gl.UNSIGNED_BYTE;

    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, wrap);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, wrap);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, filter);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, filter);

    if(resource instanceof Resource) {
      const img = resource.response;
      gl.texImage2D(gl.TEXTURE_2D, 0, internalFormat, img.width, img.height, 0, format, type, img);
      gl.generateMipmap(gl.TEXTURE_2D);
    } else {
      const width  = resource.width;
      const height = resource.height;
      const data   = resource.data;
      gl.texImage2D(gl.TEXTURE_2D, 0, internalFormat, width, height, 0, format, type, data);
    }

    this.#handle = texture;
  }

  bindTexture(location = 0) {
    gl.activeTexture(gl.TEXTURE0 + location);
    gl.bindTexture(gl.TEXTURE_2D, this.#handle);
  }

  get handle() {
    return this.#handle;
  }

  static async init() {
    const img = (await Resource.load(IMAGE, ['./assets/grid.png']))[0];

    const textureData = new Uint8Array([255, 255, 255, 255, 
                                        127, 127, 127, 255, 
                                        127, 127, 127, 255, 
                                        255, 255, 255, 255]);
    const textureData2 = new Uint8Array([255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255]);

    this.NORMAL_TEXTURE = new Texture({ width: 2, height: 2, data: textureData2 });
    this.NO_TEXTURE = new Texture({ width: 2, height: 2, data: textureData2 }, {
      filter: gl.NEAREST,
      internalFormat: gl.RGBA
    });
    //this.NORMAL_TEXTURE = await Texture.create('./assets/nor.jpg');
  }
}
