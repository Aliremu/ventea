import { BoxCollider, DirectionalLight, LastPosition, MeshCollider, MeshRenderer, Position, RigidBody, Rotation, Size, SphereCollider, Tag } from "./Components.js";
import { Resource } from "./Resource.js";
import { defineQuery, getAllEntities, getEntityComponents, hasComponent } from "../lib/bitECS/index.mjs";
import { AssetManager } from "./AssetManager.js";
import { Utils } from "./Utils.js";
import 'https://flyover.github.io/imgui-js/dist/imgui.umd.js';
import 'https://flyover.github.io/imgui-js/dist/imgui_impl.umd.js';

const physicsQuery = defineQuery([MeshRenderer]);

let lastTime = 0;
let selectedEntity = null;

const DrawVec3Control = (label, values, resetValue = 0.0, columnWidth = 70.0) => {
    ImGui.PushID(label);

    ImGui.Columns(2);
    ImGui.SetColumnWidth(0, 100);
    ImGui.Text(label);
    ImGui.NextColumn();

    ImGui.PushItemWidth(columnWidth);
    ImGui.PushItemWidth(columnWidth);
    ImGui.PushItemWidth(columnWidth);
    ImGui.PushStyleVar(ImGui.ImGuiStyleVar.ItemSpacing, new ImGui.ImVec2(0, 0));

    const lineHeight = 11 * 2.0;
    console.log()
    const buttonSize = { x: lineHeight + 3.0, y: lineHeight };

    ImGui.PushStyleColor(ImGui.ImGuiCol.Button, new ImGui.ImVec4(0.8, 0.1, 0.15, 1.0));
    ImGui.PushStyleColor(ImGui.ImGuiCol.ButtonHovered, new ImGui.ImVec4(0.9, 0.2, 0.2, 1.0));
    ImGui.PushStyleColor(ImGui.ImGuiCol.ButtonActive, new ImGui.ImVec4(0.8, 0.1, 0.15, 1.0));
    //ImGui.PushFont(boldFont);
    if (ImGui.Button("X", buttonSize))
        values.x = resetValue;
    //ImGui.PopFont();
    ImGui.PopStyleColor(3);

    ImGui.SameLine();
    ImGui.DragFloat("##X", (value = values.x) => values.x = value, 0.1, 0.0, 0.0, "%.2f");
    ImGui.PopItemWidth();
    ImGui.SameLine();

    ImGui.PushStyleColor(ImGui.ImGuiCol.Button, new ImGui.ImVec4(0.2, 0.7, 0.2, 1.0));
    ImGui.PushStyleColor(ImGui.ImGuiCol.ButtonHovered, new ImGui.ImVec4(0.3, 0.8, 0.3, 1.0));
    ImGui.PushStyleColor(ImGui.ImGuiCol.ButtonActive, new ImGui.ImVec4(0.2, 0.7, 0.2, 1.0));
    //ImGui.PushFont(boldFont);
    if (ImGui.Button("Y", buttonSize))
        values.y = resetValue;
    //ImGui.PopFont();
    ImGui.PopStyleColor(3);

    ImGui.SameLine();
    ImGui.DragFloat("##Y", (value = values.y) => values.y = value, 0.1, 0.0, 0.0, "%.2f");
    ImGui.PopItemWidth();
    ImGui.SameLine();

    ImGui.PushStyleColor(ImGui.ImGuiCol.Button, new ImGui.ImVec4(0.1, 0.25, 0.8, 1.0));
    ImGui.PushStyleColor(ImGui.ImGuiCol.ButtonHovered, new ImGui.ImVec4(0.2, 0.35, 0.9, 1.0));
    ImGui.PushStyleColor(ImGui.ImGuiCol.ButtonActive, new ImGui.ImVec4(0.1, 0.25, 0.8, 1.0));
    //ImGui.PushFont(boldFont);
    if (ImGui.Button("Z", buttonSize))
        values.z = resetValue;
    //ImGui.PopFont();
    ImGui.PopStyleColor(3);

    ImGui.SameLine();
    ImGui.DragFloat("##Z", (value = values.z) => values.z = value, 0.1, 0.0, 0.0, "%.2f");
    ImGui.PopItemWidth();

    ImGui.PopStyleVar();

    ImGui.Columns(1);

    ImGui.PopID();
}

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

    static startDebug(scene, time, canvas) {
        let camPos = scene.camera.pos;

        const x = (Math.round(camPos[0] * 100) / 100).toFixed(2);
        const y = (Math.round(camPos[1] * 100) / 100).toFixed(2);
        const z = (Math.round(camPos[2] * 100) / 100).toFixed(2);

        ImGui_Impl.NewFrame(time);
        ImGui.NewFrame();

        ImGui.SetNextWindowPos(new ImGui.ImVec2(0, 0), ImGui.Cond.Once);
        ImGui.SetNextWindowSize(new ImGui.ImVec2(400, 300), ImGui.Cond.Once);

        ImGui.Begin('Scene Hierarchy', null, ImGui.WindowFlags.NoResize | ImGui.WindowFlags.NoMove | ImGui.WindowFlags.NoCollapse);

        ImGui.Separator();
        ImGui.Text(`Scene: scene`);
        ImGui.Separator();
        ImGui.Text(`Camera Pos: X: ${x}, Y: ${y}, Z: ${z}`);
        ImGui.Separator();
        const frameTime = (time - lastTime);
        const fps = 1000 / frameTime;
        ImGui.Text(`Time Per Frame:    ${frameTime.toFixed(2)} ms`);
        ImGui.Text(`Frames Per Second: ${fps.toFixed(2)} FPS`);
        ImGui.Separator();

        const query = getAllEntities(scene.world);
        if (ImGui.CollapsingHeader('Entities')) {
            for (const ent of scene.pool) {
                let flags = ((selectedEntity == ent) ? ImGui.TreeNodeFlags.Selected : 0) | ImGui.TreeNodeFlags.OpenOnArrow;
                flags |= ImGui.TreeNodeFlags.SpanAvailWidth;
                const opened = ImGui.TreeNodeEx('' + Tag.tag[ent.handle], flags);

                if (ImGui.IsItemClicked()) {
                    selectedEntity = ent;
                }

                if (opened) {
                    ImGui.TreePop();
                }
            }
        }
        ImGui.Separator();

        //ImGui.Image(shadowMap1.depthTexture.handle, new ImGui.Vec2(400, 400));

        ImGui.End();

        ImGui.SetNextWindowPos(new ImGui.ImVec2(0, 300), ImGui.Cond.Once);
        ImGui.SetNextWindowSize(new ImGui.ImVec2(400, canvas.height - 300), ImGui.Cond.Once);
        ImGui.Begin('Properties', null, ImGui.WindowFlags.NoResize | ImGui.WindowFlags.NoMove | ImGui.WindowFlags.NoCollapse);
        if (selectedEntity != null) {
            const components = getEntityComponents(scene.world, selectedEntity.handle);
            if (ImGui.CollapsingHeader('Transform')) {
                DrawVec3Control(`Translation`, selectedEntity.position);
                DrawVec3Control(`Rotation`, selectedEntity.rotation);
                DrawVec3Control(`Scale`, selectedEntity.size);
            }
            for (const component of components) {
                switch (component) {
                    case DirectionalLight: {
                        if (ImGui.CollapsingHeader('DirectionalLight')) {
                        }
                        break;
                    }
                    case MeshRenderer: {
                        if (ImGui.CollapsingHeader('MeshRenderer')) { }
                        break;
                    }
                    case RigidBody: {
                        if (ImGui.CollapsingHeader('RigidBody')) { }
                        break;
                    }
                    case BoxCollider: {
                        if (ImGui.CollapsingHeader('BoxCollider')) { }
                        break;
                    }
                    case SphereCollider: {
                        if (ImGui.CollapsingHeader('SphereCollider')) { }
                        break;
                    }
                    case MeshCollider: {
                        if (ImGui.CollapsingHeader('MeshCollider')) { }
                        break;
                    }
                }
            }
        }

        ImGui.End();

        ImGui.EndFrame();

        ImGui.Render();

        lastTime = time;
    }

    static endDebug() {
        ImGui_Impl.RenderDrawData(ImGui.GetDrawData());
    }

    static renderScene(shader, scene, time) {
        const alpha = 50 * ((time - Physics.lastTime) / 1000);
        const tod = (time / 5000) % Math.PI;

        let oldCamPos = Physics.controller[0];
        let newCamPos = Physics.controller[1];

        //const x = (Math.round(newCamPos[0] * 100) / 100).toFixed(2);
        //const y = (Math.round(newCamPos[1] * 100) / 100).toFixed(2);
        //const z = (Math.round(newCamPos[2] * 100) / 100).toFixed(2);

        //fuck.innerHTML = `${x}, ${y}, ${z}`;
        let camPos = [Utils.lerp(oldCamPos[0], newCamPos[0], alpha),
        Utils.lerp(oldCamPos[1], newCamPos[1], alpha),
        Utils.lerp(oldCamPos[2], newCamPos[2], alpha)];

        scene.camera.setPos(camPos);

        shader.bind();

        shader.setMat4('View', scene.camera.getView());
        shader.setMat4('Projection', scene.camera.getProjection());

        //shader.setMat4('Model', mat4.create());
        //terrainMesh.draw();

        //shader.setMat4('Model', mat4.fromRotationTranslationScale([], [0, 0, 0, 1], [0, 0, 0], [1, 1, 1]));
        //mesh.draw();

        //this.background?.bindTexture();

        const ents = physicsQuery(scene.world);

        let tempPos = [0, 0, 0];
        let tempRot = [0, 0, 0, 1];
        let tempSize = [1, 1, 1];
        let model = mat4.create();

        for (const eid of ents) {
            tempRot[0] = Rotation.x[eid];
            tempRot[1] = Rotation.y[eid];
            tempRot[2] = Rotation.z[eid];
            tempRot[3] = Rotation.w[eid];

            tempSize[0] = Size.x[eid];
            tempSize[1] = Size.y[eid];
            tempSize[2] = Size.z[eid];
            if (hasComponent(scene.world, RigidBody, eid)) {
                tempPos[0] = Utils.lerp(LastPosition.x[eid], Position.x[eid], alpha);
                tempPos[1] = Utils.lerp(LastPosition.y[eid], Position.y[eid], alpha);
                tempPos[2] = Utils.lerp(LastPosition.z[eid], Position.z[eid], alpha);
            } else {
                tempPos[0] = Position.x[eid];
                tempPos[1] = Position.y[eid];
                tempPos[2] = Position.z[eid];
            }

            mat4.fromRotationTranslationScale(model, tempRot, tempPos, tempSize);
            shader.setMat4('Model', model);

            const mesh = AssetManager.ASSETS[MeshRenderer.resourceId[eid]];
            mesh.draw();
        }
    }
}