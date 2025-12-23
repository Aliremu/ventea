import { RendererContext } from "../RendererContext";

export class WebGLContext extends RendererContext {
    static gl: WebGL2RenderingContext;
    static ext: WEBGL_multi_draw;
    static canvas: HTMLCanvasElement;

    static async create(canvas: HTMLCanvasElement) {
        this.canvas = canvas;

        const gl = canvas.getContext('webgl2');

        if(!gl) {
            throw new Error("Could not create WebGL2 Context!");
        }

        const availableExtensions = gl.getSupportedExtensions();

        if(!availableExtensions) {
            throw new Error("Old af browser");
        }

        gl.getExtension("OES_element_index_uint");
        gl.getExtension('OES_texture_float_linear');
        gl.getExtension("WEBGL_depth_texture"); 
        gl.getExtension("EXT_color_buffer_float");
        gl.getExtension('OES_standard_derivatives'); 

        const ext = gl.getExtension("WEBGL_multi_draw");

        if(!ext) {
            throw new Error("Could not create WebGL2 Context!");
        }
        
        gl.enable(gl.DEPTH_TEST);
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
        gl.enable(gl.CULL_FACE);
        gl.cullFace(gl.BACK);
        gl.frontFace(gl.CCW);

        this.gl = gl;
        this.ext = ext;
    }
}
