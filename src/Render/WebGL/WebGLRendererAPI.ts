import { defineQuery } from "bitecs";
import { mat4 } from "gl-matrix";
import { Camera } from "../../Camera/Camera";
import { Utils } from "../../Math/Utils";
import { Vector3 } from "../../Math/Vector";
import { Mesh } from "../../Mesh/Mesh";
import { Physics } from "../../Physics/Physics";
import { Resources } from "../../Resources";
import { LastPosition, MeshRenderer, Position, Rotation, Scale } from "../../Scene/Components";
import { Scene } from "../../Scene/Scene";
import { Pipeline } from "../Pipeline";
import { RendererAPI } from "../RendererAPI";
import { Texture2D } from "../Texture2D";
import { UniformBuffer } from "../UniformBuffer";
import { WebGLContext } from "./WebGLContext";
import { WebGLIndexBuffer } from "./WebGLIndexBuffer";
import { WebGLPipeline } from "./WebGLPipeline";
import { WebGLTexture2D } from "./WebGLTexture2D";
import { WebGLUniformBuffer } from "./WebGLUniformBuffer";
import { WebGLVertexBuffer } from "./WebGLVertexBuffer";

const meshQuery = defineQuery([MeshRenderer]);



export class WebGLRendererAPI extends RendererAPI {
    static lightsBuffer: WebGLUniformBuffer;

    static async create(canvas: HTMLCanvasElement): Promise<RendererAPI> {
        await WebGLContext.create(canvas);

        return new WebGLRendererAPI();
    }

    beginRenderPass(time: number, camera: Camera): void {
        const gl = WebGLContext.gl;

        gl.clearColor(0.95, 0.9, 0.85, 1.0);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    }
    endRenderPass(): void {
        // throw new Error("Method not implemented.");
    }
    drawIndexed(size: number): void {
        // throw new Error("Method not implemented.");
    }
    renderScene(scene: Scene, time: number, camera: Camera, pipe?: Pipeline): void {
        const gl = WebGLContext.gl;
        
        const ents = meshQuery(scene.world);
        let transform = mat4.create();
        let lastMesh = null;

        const trans = new Vector3();

        // const start = performance.now();

        for (const eid of ents) {
            /*const arr = [
                ...test(MeshRenderer.uuid.w0[eid]),
                ...test(MeshRenderer.uuid.w1[eid]),
                ...test(MeshRenderer.uuid.w2[eid]),
                ...test(MeshRenderer.uuid.w3[eid])
            ];

            const uuid = uuidStringify(arr); //TODO costly*/
            // const mesh: Mesh = Resources.resources.values().next().value;
            const mesh: Mesh = Resources.get<Mesh>(MeshRenderer.assetId[eid]);

            const alpha = Utils.clamp(50 * ((time - Physics.lastTime) / 1000), 0, 1);

            trans.x = Utils.lerp(LastPosition.x[eid], Position.x[eid], alpha);
            trans.y = Utils.lerp(LastPosition.y[eid], Position.y[eid], alpha);
            trans.z = Utils.lerp(LastPosition.z[eid], Position.z[eid], alpha);

            mat4.identity(transform);
            mat4.translate(transform, transform, trans.buffer);
            mat4.rotateY(transform, transform, Rotation.y[eid]);
            mat4.rotateX(transform, transform, Rotation.x[eid]);
            mat4.rotateZ(transform, transform, Rotation.z[eid]);
            mat4.scale(transform, transform, [Scale.x[eid], Scale.y[eid], Scale.z[eid]]);

            if (lastMesh != mesh) {
                gl.enableVertexAttribArray(0);
                gl.bindBuffer(gl.ARRAY_BUFFER, mesh.positionBuffer.as<WebGLVertexBuffer>().buffer);
                gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 0, 0);

                gl.enableVertexAttribArray(1);
                gl.bindBuffer(gl.ARRAY_BUFFER, mesh.normalBuffer.as<WebGLVertexBuffer>().buffer);
                gl.vertexAttribPointer(1, 3, gl.FLOAT, false, 0, 0);

                gl.enableVertexAttribArray(2);
                gl.bindBuffer(gl.ARRAY_BUFFER, mesh.texCoordBuffer.as<WebGLVertexBuffer>().buffer);
                gl.vertexAttribPointer(2, 2, gl.FLOAT, false, 0, 0);

                gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, mesh.indexBuffer.as<WebGLIndexBuffer>().buffer);
            }  

            lastMesh = mesh;

            for (const s of mesh.subMeshes) {
                const material = s.material!;
                const pipeline = pipe ? pipe.as<WebGLPipeline>() : material.pipeline?.as<WebGLPipeline>()!;
                const shader = pipeline.shader;

                gl.useProgram(shader.program);

                shader.setUniforms({
                    'view': camera.viewMatrix as Float32Array,
                    'proj': camera.projectionMatrix as Float32Array,
                    'model': transform as Float32Array
                });

                if (s.material?.descriptor) {
                    let i = 0;
                    for(const [name, resource] of s.material.descriptor) {
                        if(!shader.uniforms.has(name)) continue;

                        const location = shader.uniforms.get(name).location;

                        if(resource instanceof Texture2D) {
                            const texture = resource.as<WebGLTexture2D>();
                            shader.setUniforms({
                                [name]: i
                            });
                            gl.activeTexture(gl.TEXTURE0 + i);
                            gl.bindTexture(gl.TEXTURE_2D, texture.texture);
                            i++;
                        }

                        if(resource instanceof UniformBuffer) {
                            const buffer = resource.as<WebGLUniformBuffer>();
                            
                            gl.bindBufferRange(gl.UNIFORM_BUFFER, location, buffer.buffer, 0, 28);
                        }
                    }
                }

                const mode = pipeline.layout.wireframe ? gl.LINES : gl.TRIANGLES;

                if(s.baseVertex > 0) {
                    gl.bindBuffer(gl.ARRAY_BUFFER, mesh.positionBuffer.as<WebGLVertexBuffer>().buffer);
                    gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 0, s.baseVertex * 3 * 4); // 3 * 4 Stride
                    gl.bindBuffer(gl.ARRAY_BUFFER, mesh.normalBuffer.as<WebGLVertexBuffer>().buffer);
                    gl.vertexAttribPointer(1, 3, gl.FLOAT, false, 0, s.baseVertex * 3 * 4);
                    gl.bindBuffer(gl.ARRAY_BUFFER, mesh.texCoordBuffer.as<WebGLVertexBuffer>().buffer);
                    gl.vertexAttribPointer(2, 2, gl.FLOAT, false, 0, s.baseVertex * 2 * 4);
                }

                gl.drawElementsInstanced(mode, s.indexCount, gl.UNSIGNED_INT, s.baseIndex * 4, 1);
            }
        }

        // const end = performance.now();

        // test.innerHTML = (end - start).toString();
    }

    resize(width: number, height: number): void {
        const gl = WebGLContext.gl;
        gl.viewport(0, 0, width, height);
    }
}