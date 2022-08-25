import { createWorld, addEntity } from "../lib/bitECS/index.mjs";
import { LastPosition, MeshRenderer, Position, Rotation, Size, Tag } from "./Components.js";
import { Entity } from "./Entity.js";
import { Resource } from "./Resource.js";
import { Utils } from "./Utils.js";

const uuidv4 = () => {
    return Math.floor(Date.now() * Math.random());
}


export class Scene {
    world;
    background = null;
    camera = null;

    constructor() {
        this.world = createWorld();
        this.pool = [];

        Physics.set({
            scene: this
        });
    }

    createEntity(name) {
        const handle = addEntity(this.world);
        const entity = new Entity(handle, this);

        entity.addComponent(Tag, { tag: uuidv4() });
        entity.addComponent(Position, { x: 0, y: 0, z: 0 });
        entity.addComponent(LastPosition, { x: 0, y: 0, z: 0 });
        entity.addComponent(Rotation, { x: 0, y: 0, z: 0, w: 1 });
        entity.addComponent(Size, { x: 1, y: 1, z: 1 });

        this.pool[handle] = entity;

        return entity;
    }

    render(time) {
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

        camera.setPos(camPos);

        gl.clearColor(0.1, 0.1, 0.1, 1.0);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        const lightDir = [Math.cos(tod), -Math.sin(tod), 0];

        let lightProjection = mat4.create();
        let lightView = mat4.create();
        let lightSpaceMatrix = mat4.create();

        let corners = getFrustumCornersWorldSpace(camera.getView(), 10);
        let center = getCenter(corners);
        let test = [center[0] + lightDir[0], center[1] + lightDir[1], center[2]];
        mat4.lookAt(lightView, center, test, [0, 1, 0]);
        let frustum = getTightFrustum(corners, lightView);
        mat4.ortho(lightProjection, frustum.minX, frustum.maxX, frustum.minY, frustum.maxY, frustum.minZ, frustum.maxZ);
        mat4.multiply(lightSpaceMatrix, lightProjection, lightView);
        shadow.bind();
        shadow.setMat4('LightSpace', lightSpaceMatrix);
        shadowMap1.bind();
        drawScene(alpha, shadow, camPos);
        shadowMap1.unbind();

        gl.viewport(0, 0, window.innerWidth, window.innerHeight);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        fbo.bind();
        shader.bind();
        shader.setMat4('View', camera.getView());
        shader.setMat4('Projection', camera.getProjection());
        shader.setMat4('LightSpace', lightSpaceMatrix);
        shader.setVec3('LightDirection', lightDir);
        shadowMap1.depthTexture.bindTexture(2);
        drawScene(alpha, shader);

        /** Skybox */

        gl.disable(gl.CULL_FACE);
        gl.depthMask(false);
        gl.depthFunc(gl.LEQUAL);
        skybox.bind();
        skybox.setMat4('View', camera.getView());
        skybox.setMat4('Projection', camera.getProjection());
        cubemap.bindTexture();
        cube.draw();
        gl.depthFunc(gl.LESS);
        gl.depthMask(true);
        gl.enable(gl.CULL_FACE);

        fbo.unbind();

        fbo2.bind();
        bloom.shader.bind();
        bloom.shader.setInt('u_Stage', 1);
        fbo.colorTexture.bindTexture(0);
        fbo.depthTexture.bindTexture(1);
        fbo.draw();
        fbo2.unbind();

        bloom.bind();
        fbo2.colorTexture.bindTexture(0);
        fbo2.depthTexture.bindTexture(1);
        bloom.draw();
        bloom.unbind();

        post.bind();
        fbo.colorTexture.bindTexture(0);
        fbo.depthTexture.bindTexture(1);
        bloom.bindBloom(2);
        fbo.draw();
    }
}