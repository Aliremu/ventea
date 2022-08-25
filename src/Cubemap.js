export class Cubemap {
  #texture;

  constructor(resources) {
    const texture = gl.createTexture();

    gl.bindTexture(gl.TEXTURE_CUBE_MAP, texture);

    for (const [i, resource] of resources.entries()) {
      const img = resource.response;
      gl.texImage2D(gl.TEXTURE_CUBE_MAP_POSITIVE_X + i, 0, gl.RGB, img.width, img.height, 0, gl.RGB, gl.UNSIGNED_BYTE, img);
    }

    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

    this.#texture = texture;
  }

  bindTexture(location = 0) {
    gl.activeTexture(gl.TEXTURE0 + location);
    gl.bindTexture(gl.TEXTURE_CUBE_MAP, this.#texture);
  }
}
