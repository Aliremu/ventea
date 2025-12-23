import { defineQuery } from "bitecs";
import { mat4 } from "gl-matrix";
import { ICamera } from "../../Camera/ICamera";
import { Utils } from "../../Math/Utils";
import { Vector3 } from "../../Math/Vector";
import { Material } from "../../Mesh/Material";
import { Mesh, SubMesh } from "../../Mesh/Mesh";
import { Physics } from "../../Physics/Physics";
import { Resources } from "../../Resources";
import { LastPosition, Light, MeshRenderer, Position, Rotation, Scale } from "../../Scene/Components";
import { Scene } from "../../Scene/Scene";
import { Pipeline } from "../Pipeline";
import { Renderer } from "../Renderer";
import { RendererAPI } from "../RendererAPI";
import { SamplerFilter, Wrap } from "../Sampler";
import { Shader } from "../Shader";
import { PBRShaderMaterial } from "../Shader/PBRShaderMaterial";
import { Texture2D } from "../Texture2D";
import { TextureFormat } from "../TextureFormat";
import { UniformBuffer } from "../UniformBuffer";
import { WebGLContext } from "./WebGLContext";
import { WebGLIndexBuffer } from "./WebGLIndexBuffer";
import { WebGLPipeline } from "./WebGLPipeline";
import { WebGLShader } from "./WebGLShader";
import { WebGLTexture2D } from "./WebGLTexture2D";
import { WebGLUniformBuffer } from "./WebGLUniformBuffer";
import { WebGLVertexBuffer } from "./WebGLVertexBuffer";
import { ShaderType } from "../Pipeline";
import { MeshData } from "../../Mesh/MeshData";
import { SphereMesh } from "../../Mesh/SphereMesh";

const meshQuery = defineQuery([MeshRenderer]);
const lightQuery = defineQuery([Light]);

const tmpTransform = mat4.create();
const tmpTranslate = new Vector3();
const tmpScale = new Vector3();

interface DrawCommand {
    mesh: Mesh,
    instanceCount: number
}

const drawList = new Map<number, DrawCommand>();
const shadowDrawList = new Map<number, DrawCommand>();
const transformStorage = new Map<number, Array<mat4>>();

export class WebGLRendererAPI extends RendererAPI {
    static lightsBuffer: WebGLUniformBuffer;
    static transformBuffer: Float32Array;
    static transformVertexBuffer: WebGLVertexBuffer;
    static transformTexture: WebGLTexture2D;

    static skyboxPipeline: WebGLPipeline;
    static skyboxBuffer: MeshData;

    static async create(canvas: HTMLCanvasElement): Promise<RendererAPI> {
        await WebGLContext.create(canvas);

        this.transformBuffer = new Float32Array(512 * 512 * 4);
        this.transformVertexBuffer = new WebGLVertexBuffer(this.transformBuffer, this.transformBuffer.length, true);
        this.transformTexture = new WebGLTexture2D(512, 512, TextureFormat.RGBA32F, {
            wrapS: Wrap.Repeat,
            wrapT: Wrap.Repeat,
            minFilter: SamplerFilter.Nearest,
            magFilter: SamplerFilter.Nearest,
            mip: false
        });

        this.transformTexture.setData(WebGLRendererAPI.transformBuffer);

        this.skyboxBuffer = new SphereMesh(1.0);

        return new WebGLRendererAPI();
    }

    beginRenderPass(time: number, camera: ICamera): void {
        const gl = WebGLContext.gl;

        gl.clearColor(0.95, 0.9, 0.85, 1.0);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    }

    endRenderPass(scene: Scene): void {
        const gl = WebGLContext.gl;

        let count = 0;

        for (const [handle, dc] of drawList) {
            if (dc.instanceCount < 1) continue;

            const transforms = transformStorage.get(handle);

            if (!transforms) continue;

            for (const transform of transforms) {
                WebGLRendererAPI.transformBuffer.set(transform, count * 16);
                count++;
            }
        }

        WebGLRendererAPI.transformVertexBuffer.setData(WebGLRendererAPI.transformBuffer, count * 16);
        // WebGLRendererAPI.transformTexture.setData(WebGLRendererAPI.transformBuffer, count * 16);
        gl.bindTexture(gl.TEXTURE_2D, WebGLRendererAPI.transformTexture.texture);
        gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, 512, 4 * Math.ceil(count / 512), gl.RGBA, gl.FLOAT, WebGLRendererAPI.transformBuffer);
        count = 0;

        const pipeline = Renderer.staticOpaquePipeline.as<WebGLPipeline>();
        const shader = pipeline.shader;
        gl.useProgram(shader.program);
        gl.activeTexture(gl.TEXTURE0 + 20);
        gl.bindTexture(gl.TEXTURE_2D, WebGLRendererAPI.transformTexture.texture);

        gl.activeTexture(gl.TEXTURE0 + 10);
        gl.bindTexture(gl.TEXTURE_2D, scene.background.as<WebGLTexture2D>().texture);

        gl.activeTexture(gl.TEXTURE0 + 11);
        gl.bindTexture(gl.TEXTURE_2D, Renderer.specular_lut.as<WebGLTexture2D>().texture);

        for (const [handle, dc] of drawList) {
            if (dc.instanceCount < 1) continue;

            const mesh = dc.mesh;

            this.drawStaticMesh(mesh, Renderer.staticOpaquePipeline, count, dc.instanceCount);

            count += dc.instanceCount;
            dc.instanceCount = 0;
            transformStorage.get(dc.mesh.handle)!.length = 0;
        }

        gl.useProgram(Renderer.skyboxPipeline.as<WebGLPipeline>().shader.program);
        gl.activeTexture(gl.TEXTURE0 + 10);
        gl.bindTexture(gl.TEXTURE_2D, scene.background.as<WebGLTexture2D>().texture);
        gl.enableVertexAttribArray(0);
        gl.bindBuffer(gl.ARRAY_BUFFER, WebGLRendererAPI.skyboxBuffer.positionBuffer.as<WebGLVertexBuffer>().buffer);
        gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(1);
        gl.bindBuffer(gl.ARRAY_BUFFER, WebGLRendererAPI.skyboxBuffer.normalBuffer.as<WebGLVertexBuffer>().buffer);
        gl.vertexAttribPointer(1, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(2);
        gl.bindBuffer(gl.ARRAY_BUFFER, WebGLRendererAPI.skyboxBuffer.texCoordBuffer.as<WebGLVertexBuffer>().buffer);
        gl.vertexAttribPointer(2, 2, gl.FLOAT, false, 0, 0);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, WebGLRendererAPI.skyboxBuffer.indexBuffer.as<WebGLIndexBuffer>().buffer);
        gl.disable(gl.CULL_FACE);
        gl.depthFunc(gl.LEQUAL);
        gl.drawElements(gl.TRIANGLES, WebGLRendererAPI.skyboxBuffer.indices.length, gl.UNSIGNED_INT, 0);
        gl.depthFunc(gl.LESS);
        gl.enable(gl.CULL_FACE);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
        gl.bindBuffer(gl.ARRAY_BUFFER, null);
        gl.useProgram(null);

        gl.flush();
    }

    drawIndexed(size: number): void {
        // throw new Error("Method not implemented.");
    }

    submitStaticMesh(mesh: Mesh, transform: mat4) {
        // const hash = (mesh.handle << 32) | 
        if (!drawList.has(mesh.handle)) {
            drawList.set(mesh.handle, {
                mesh: mesh,
                instanceCount: 1
            });

            transformStorage.set(mesh.handle, [transform]);
        } else {
            const dc = drawList.get(mesh.handle)!;
            dc.instanceCount++;

            transformStorage.get(mesh.handle)?.push(transform);
        }
    }

    drawStaticMesh(mesh: Mesh, pipeline: Pipeline, transformOffset: number, instanceCount: number) {
        const gl = WebGLContext.gl;

        const meshData = mesh.meshData;

        const shader = pipeline.as<WebGLPipeline>().shader;

        shader.setUniform('offset', transformOffset);

        let lastShader = null;

        if (mesh.subMeshes.length == 0) {
            gl.bindVertexArray(meshData.vao!);

            const material = mesh.material ?? PBRShaderMaterial.DEFAULT;
            const shad = material.shader.as<WebGLShader>();
            
            if(shad != lastShader) {
                gl.useProgram(shad.program);
                shad.setUniform('offset', transformOffset);
                lastShader = shad;
            }

            if (material?.descriptor) {
                let i = 0;
                for (const [name, resource] of material.descriptor) {
                    if (!shader.uniforms.has(name)) continue;

                    const location = shader.uniforms.get(name).location;

                    if (resource instanceof Texture2D) {
                        const texture = resource.as<WebGLTexture2D>();
                        shader.setUniform(name, i);
                        gl.activeTexture(gl.TEXTURE0 + i);
                        gl.bindTexture(gl.TEXTURE_2D, texture.texture);
                        i++;
                    }

                    if (resource instanceof UniformBuffer) {
                        const buffer = resource.as<WebGLUniformBuffer>();

                        gl.bindBufferRange(gl.UNIFORM_BUFFER, location, buffer.buffer, 0, 28);
                    }
                }
            }

            gl.drawElementsInstanced(gl.TRIANGLES, meshData.indices.length, gl.UNSIGNED_INT, 0, instanceCount);

            gl.bindVertexArray(null);
        } else {
            gl.enableVertexAttribArray(0);
            gl.bindBuffer(gl.ARRAY_BUFFER, mesh.meshData.positionBuffer.as<WebGLVertexBuffer>().buffer);
            gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 0, 0);

            gl.enableVertexAttribArray(1);
            gl.bindBuffer(gl.ARRAY_BUFFER, mesh.meshData.normalBuffer.as<WebGLVertexBuffer>().buffer);
            gl.vertexAttribPointer(1, 3, gl.FLOAT, false, 0, 0);

            gl.enableVertexAttribArray(2);
            gl.bindBuffer(gl.ARRAY_BUFFER, mesh.meshData.texCoordBuffer.as<WebGLVertexBuffer>().buffer);
            gl.vertexAttribPointer(2, 2, gl.FLOAT, false, 0, 0);

            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, mesh.meshData.indexBuffer.as<WebGLIndexBuffer>().buffer);

            for (const subMesh of mesh.subMeshes) {
                const material = mesh.material ?? (subMesh.material ?? PBRShaderMaterial.DEFAULT);

                if (material?.descriptor) {
                    let i = 0;
                    for (const [name, resource] of material.descriptor) {
                        if (!shader.uniforms.has(name)) continue;

                        const location = shader.uniforms.get(name).location;

                        if (resource instanceof Texture2D) {
                            const texture = resource.as<WebGLTexture2D>();
                            shader.setUniform(name, i);
                            gl.activeTexture(gl.TEXTURE0 + i);
                            gl.bindTexture(gl.TEXTURE_2D, texture.texture);
                            i++;
                        }

                        if (resource instanceof UniformBuffer) {
                            const buffer = resource.as<WebGLUniformBuffer>();

                            gl.bindBufferRange(gl.UNIFORM_BUFFER, location, buffer.buffer, 0, buffer.size);
                        }
                    }
                }

                if (subMesh.baseVertex > 0) {
                    gl.bindBuffer(gl.ARRAY_BUFFER, mesh.meshData.positionBuffer.as<WebGLVertexBuffer>().buffer);
                    gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 0, subMesh.baseVertex * 3 * 4); // 3 * 4 Stride
                    gl.bindBuffer(gl.ARRAY_BUFFER, mesh.meshData.normalBuffer.as<WebGLVertexBuffer>().buffer);
                    gl.vertexAttribPointer(1, 3, gl.FLOAT, false, 0, subMesh.baseVertex * 3 * 4);
                    gl.bindBuffer(gl.ARRAY_BUFFER, mesh.meshData.texCoordBuffer.as<WebGLVertexBuffer>().buffer);
                    gl.vertexAttribPointer(2, 2, gl.FLOAT, false, 0, subMesh.baseVertex * 2 * 4);
                }

                const mode = pipeline.layout.wireframe ? gl.LINES : gl.TRIANGLES;

                gl.drawElementsInstanced(mode, subMesh.indexCount, gl.UNSIGNED_INT, subMesh.baseIndex * 4, instanceCount);
            }
        }

        // /*gl.bindBuffer(gl.ARRAY_BUFFER, WebGLRendererAPI.transformVertexBuffer.buffer);

        // for (let ii = 0; ii < 4; ++ii) {
        //     gl.enableVertexAttribArray(3 + ii);
        //     gl.vertexAttribPointer(3 + ii, 4, gl.FLOAT, false, 64, count * 64 + ii * 16);
        //     gl.vertexAttribDivisor(3 + ii, 1);
        // }*/
    }

    renderScene(scene: Scene, time: number, camera: ICamera, pipe?: Pipeline): void {
        // drawList.clear();

        const gl = WebGLContext.gl;
        const ext = WebGLContext.ext;

        const ents = meshQuery(scene.world);
        const lights = lightQuery(scene.world);

        let lastMesh = null;
        let lastShader = null;

        const alpha = Utils.clamp(50 * ((time - Physics.lastTime) / 1000), 0, 1);
        // const start = performance.now();
        let wtf = 0;

        for (const [name, shader] of Shader.REGISTRY) {
            const glShader = shader.as<WebGLShader>();
            gl.useProgram(glShader.program)
            glShader.setUniforms({
                'view': camera.viewMatrix as Float32Array,
                'proj': camera.projectionMatrix as Float32Array,
                'skyboxTexture': 10,
                'specularBRDF': 11,
                'transformTexture': 20
            });

            let i = 0;

            for (const light of lights) {
                if (!scene.pool[light].isVisible) continue;

                const x = Position.x[light];
                const y = Position.y[light];
                const z = Position.z[light];

                const r = Light.color.x[light];
                const g = Light.color.y[light];
                const b = Light.color.z[light];

                const type = Light.type[light];

                const name = `lights[${i}]`;

                glShader.setUniforms({
                    [name + ".position"]: [x, y, z],
                    [name + ".color"]: [r, g, b],
                    [name + ".type"]: type
                });

                i++;
            }

            glShader.setUniform('num_lights', i);
        }

        for (const eid of ents) {
            const mesh: Mesh = Resources.get<Mesh>(MeshRenderer.assetId[eid]);

            tmpTranslate.x = Utils.lerp(LastPosition.x[eid], Position.x[eid], alpha);
            tmpTranslate.y = Utils.lerp(LastPosition.y[eid], Position.y[eid], alpha);
            tmpTranslate.z = Utils.lerp(LastPosition.z[eid], Position.z[eid], alpha);

            tmpScale.x = Scale.x[eid];
            tmpScale.y = Scale.y[eid];
            tmpScale.z = Scale.z[eid];

            mat4.identity(tmpTransform);
            mat4.translate(tmpTransform, tmpTransform, tmpTranslate.buffer);
            mat4.rotateY(tmpTransform, tmpTransform, Rotation.y[eid]);
            mat4.rotateX(tmpTransform, tmpTransform, Rotation.x[eid]);
            mat4.rotateZ(tmpTransform, tmpTransform, Rotation.z[eid]);
            mat4.scale(tmpTransform, tmpTransform, tmpScale.buffer);

            this.submitStaticMesh(mesh, tmpTransform.slice() as Float32Array);
        }

        // TODO

        // for (const eid of ents) {
        //     const mesh: Mesh = Resources.get<Mesh>(MeshRenderer.assetId[eid]);

        //     tmpTranslate.x = Utils.lerp(LastPosition.x[eid], Position.x[eid], alpha);
        //     tmpTranslate.y = Utils.lerp(LastPosition.y[eid], Position.y[eid], alpha);
        //     tmpTranslate.z = Utils.lerp(LastPosition.z[eid], Position.z[eid], alpha);

        //     tmpScale.x = Scale.x[eid];
        //     tmpScale.y = Scale.y[eid];
        //     tmpScale.z = Scale.z[eid];

        //     mat4.identity(tmpTransform);
        //     mat4.translate(tmpTransform, tmpTransform, tmpTranslate.buffer);
        //     mat4.rotateY(tmpTransform, tmpTransform, Rotation.y[eid]);
        //     mat4.rotateX(tmpTransform, tmpTransform, Rotation.x[eid]);
        //     mat4.rotateZ(tmpTransform, tmpTransform, Rotation.z[eid]);
        //     mat4.scale(tmpTransform, tmpTransform, tmpScale.buffer);

        //     if (lastMesh != mesh) {
        //         gl.enableVertexAttribArray(0);
        //         gl.bindBuffer(gl.ARRAY_BUFFER, mesh.positionBuffer.as<WebGLVertexBuffer>().buffer);
        //         gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 0, 0);

        //         gl.enableVertexAttribArray(1);
        //         gl.bindBuffer(gl.ARRAY_BUFFER, mesh.normalBuffer.as<WebGLVertexBuffer>().buffer);
        //         gl.vertexAttribPointer(1, 3, gl.FLOAT, false, 0, 0);

        //         gl.enableVertexAttribArray(2);
        //         gl.bindBuffer(gl.ARRAY_BUFFER, mesh.texCoordBuffer.as<WebGLVertexBuffer>().buffer);
        //         gl.vertexAttribPointer(2, 2, gl.FLOAT, false, 0, 0);

        //         gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, mesh.indexBuffer.as<WebGLIndexBuffer>().buffer);
        //     }  

        //     lastMesh = mesh;
        //     // const pip = Renderer.staticOpaquePipeline;
        //     // pip.as<WebGLPipeline>().shader.setUniforms({
        //     //     'model': tmpTransform as Float32Array
        //     // });
        //     // WebGLRendererAPI.transformBuffer.set(tmpTransform, wtf * 16);

        //     for (const s of mesh.subMeshes) {
        //         const material = s.material!;
        //         const pipeline = pipe ? pipe.as<WebGLPipeline>() : material.pipeline?.as<WebGLPipeline>()!;
        //         const shader = pipeline.shader;

        //         if(lastShader != shader) {
        //             gl.useProgram(shader.program);

        //             lastShader = shader;
        //         }

        //         shader.setUniform('model', tmpTransform);

        //         if (s.material?.descriptor) {
        //             let i = 0;
        //             for(const [name, resource] of s.material.descriptor) {
        //                 if(!shader.uniforms.has(name)) continue;

        //                 const location = shader.uniforms.get(name).location;

        //                 if(resource instanceof Texture2D) {
        //                     const texture = resource.as<WebGLTexture2D>();
        //                     shader.setUniform(name, i);
        //                     gl.activeTexture(gl.TEXTURE0 + i);
        //                     gl.bindTexture(gl.TEXTURE_2D, texture.texture);
        //                     i++;
        //                 }

        //                 if(resource instanceof UniformBuffer) {
        //                     const buffer = resource.as<WebGLUniformBuffer>();

        //                     gl.bindBufferRange(gl.UNIFORM_BUFFER, location, buffer.buffer, 0, 28);
        //                 }
        //             }
        //         }

        //         const mode = pipeline.layout.wireframe ? gl.LINES : gl.TRIANGLES;

        //         if(s.baseVertex > 0) {
        //             gl.bindBuffer(gl.ARRAY_BUFFER, mesh.positionBuffer.as<WebGLVertexBuffer>().buffer);
        //             gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 0, s.baseVertex * 3 * 4); // 3 * 4 Stride
        //             gl.bindBuffer(gl.ARRAY_BUFFER, mesh.normalBuffer.as<WebGLVertexBuffer>().buffer);
        //             gl.vertexAttribPointer(1, 3, gl.FLOAT, false, 0, s.baseVertex * 3 * 4);
        //             gl.bindBuffer(gl.ARRAY_BUFFER, mesh.texCoordBuffer.as<WebGLVertexBuffer>().buffer);
        //             gl.vertexAttribPointer(2, 2, gl.FLOAT, false, 0, s.baseVertex * 2 * 4);
        //         }

        //         gl.drawElementsInstanced(mode, s.indexCount, gl.UNSIGNED_INT, s.baseIndex * 4, 1);
        //     }
        //     wtf++;
        // }
    }

    resize(width: number, height: number): void {
        const gl = WebGLContext.gl;
        gl.viewport(0, 0, width, height);
    }
}