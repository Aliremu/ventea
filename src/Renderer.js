export class Renderer {
    static QUADS = {
        vbo: null,
        ibo: null
    }
    
    constructor() { }

    static init() {
        const vertices = [
            0.0, 0.0,
            1.0, 0.0,
            1.0, 1.0,
            0.0, 1.0
        ];

        const indices = [
            0, 1, 2, 0, 2, 3
        ];

        const vbo = gl.createBuffer();
        const ibo = gl.createBuffer();

        gl.enableVertexAttribArray(0);
        gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
        gl.vertexAttribPointer(0, 2, gl.FLOAT, gl.FALSE, 0, 0);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
        gl.bindBuffer(gl.ARRAY_BUFFER, null);

        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibo);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);

        Renderer.QUADS.vbo = vbo;
        Renderer.QUADS.ibo = ibo;
    }

    static drawQuad() {
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, Renderer.QUADS.ibo);
        gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
    }
}