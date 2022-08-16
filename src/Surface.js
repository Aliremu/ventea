export class Surface {
    #id;
    #gl;
    #canvas;
    #events = {};

    constructor(id) {
        this.#id = id;

        this.#canvas = document.getElementById(id);

        this.#canvas.onclick = () => {
            this.#canvas.requestPointerLock();
        }

        /** @type {WebGLRenderingContext} */
        window.gl = this.#canvas.getContext('webgl2');
        gl.getExtension("OES_element_index_uint");
        gl.getExtension('OES_texture_float_linear');
        gl.getExtension("WEBGL_depth_texture"); 
        gl.getExtension("EXT_color_buffer_float"); 
        
        document.addEventListener('mousemove', (e) => {
            if (!this.#events['mousemove']) return;

            for (const func of this.#events['mousemove']) {
                func(e);
            }
        });

        document.addEventListener('keydown', (e) => {
            if (!this.#events['keydown']) return;

            for (const func of this.#events['keydown']) {
                func(e);
            }
        });

        document.addEventListener('keyup', (e) => {
            if (!this.#events['keyup']) return;

            for (const func of this.#events['keyup']) {
                func(e);
            }
        });

        document.addEventListener('click', (e) => {
            if (!this.#events['click']) return;

            for (const func of this.#events['click']) {
                func(e);
            }
        });

        window.onresize = () => {
            this.resize(window.innerWidth, window.innerHeight);
        }
    }

    resize(width, height) {
        this.#canvas.width = width;
        this.#canvas.height = height;

        if(gl == null) return;

        gl.viewport(0, 0, width, height);
    }

    bind(event, func) {
        this.#events[event] = this.#events[event] ? [...this.#events[event], func] : [func];
    }
}