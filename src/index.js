import * as VENTEA from './Ventea.js';
import { AssetManager } from './AssetManager.js';
import 'https://flyover.github.io/imgui-js/dist/imgui.umd.js';
import 'https://flyover.github.io/imgui-js/dist/imgui_impl.umd.js';
import { defineQuery, getAllEntities, getEntityComponents } from '../lib/bitECS/index.mjs';

document.getElementById('button').addEventListener('click', async (e) => {
  document.getElementById('start').style.display = "none";
  document.getElementById('loading').style.display = "block";
  await init();
  document.getElementById('loading').style.display = "none";
  document.getElementById('game-wrapper').style.display = "block";
});

const LoadArrayBuffer = async (url) => {
  const response = await fetch(url);
  return response.arrayBuffer();
}

const AddFontFromFileTTF = async (url, size_pixels, font_cfg = null, glyph_ranges = null) => {
  font_cfg = font_cfg || new ImGui.FontConfig();
  font_cfg.Name = font_cfg.Name || `${url.split(/[\\\/]/).pop()}, ${size_pixels.toFixed(0)}px`;
  const buffer = await LoadArrayBuffer(url);
  return ImGui.GetIO().Fonts.AddFontFromMemoryTTF(buffer, size_pixels, font_cfg, glyph_ranges);
}

const init = async () => {
  console.log(ImGui);
  await ImGui.default();

  let canvas = document.getElementById('surface');
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  canvas.onclick = () => {
    if (ImGui.IsWindowHovered())
      canvas.requestPointerLock();
  }

  ImGui.CreateContext();
  const io = ImGui.GetIO();
  const font = await AddFontFromFileTTF("./assets/fonts/Roboto-Medium.ttf", 16.0);
  ImGui.GetIO().FontDefault = font;
  ImGui_Impl.Init(canvas);
  ImGui.StyleColorsDark();

  const ventea = new VENTEA.Engine(canvas, window.innerWidth, window.innerHeight);
  await ventea.init();

  console.time("---Loading Mesh---");
  const mesh = new VENTEA.GLTFMesh(await VENTEA.Resource.load(VENTEA.GLTF, './assets/Sponza.glb'));
  //console.log(mesh);
  //const venti = new VENTEA.GLTFMesh(await VENTEA.Resource.load(VENTEA.GLTF, './assets/Venti.glb'));
  console.timeEnd("---Loading Mesh---");
  const capsule = new VENTEA.Capsule(0.3, 1.0);

  const cube = new VENTEA.Cube(1000, 1, 1000);
  const cube1 = new VENTEA.Cube(1, 1, 1);

  const sphere = new VENTEA.Sphere(0.5);
  const imgs = await VENTEA.Resource.load(VENTEA.IMAGE, ['./assets/skybox/right.jpg', './assets/skybox/left.jpg', './assets/skybox/top.jpg', './assets/skybox/bottom.jpg', './assets/skybox/front.jpg', './assets/skybox/back.jpg']);
  const cubemap = new VENTEA.Cubemap(imgs);
  console.time("---Loading Terrain---");
  let terrain = new VENTEA.Terrain(300, 300);
  let terrainMesh = terrain.createMesh();
  console.timeEnd("---Loading Terrain---");
  let fuck = document.getElementById('fuck');

  const context = new AudioContext();
  const audio = new Audio('./assets/audio/sky.mp3');
  const source = context.createMediaElementSource(audio);
  source.connect(context.destination);
  audio.play();

  //var spector = new SPECTOR.Spector();
  //spector.displayUI();

  const camera = new VENTEA.Camera(glMatrix.toRadian(90), window.innerWidth / window.innerHeight, 0.1, 500);
  const control = new VENTEA.Controller(camera, ventea);

  const scene = new VENTEA.Scene();
  scene.camera = camera;

  console.log(AssetManager.ASSETS);

  /*const floor = scene.createEntity();
  floor.position.y = -1;
  floor.addComponent(VENTEA.Components.MeshRenderer, cube);
  floor.addComponent(VENTEA.Components.BoxCollider, { x: 1000, y: 1, z: 1000 });
  floor.addComponent(VENTEA.Components.RigidBody, { type: 'static' });*/

  const floor2 = scene.createEntity();
  floor2.addComponent(VENTEA.Components.MeshRenderer, terrainMesh);
  floor2.addComponent(VENTEA.Components.MeshCollider, terrainMesh);
  floor2.addComponent(VENTEA.Components.RigidBody, { type: 'static' });

  const height = 5;
  let test = null;
  for (let y = 0; y < height; y++) {
    let size = (2 * height - 1) - (2 * y);
    for (let x = 0; x < size; x++) for (let z = 0; z < size; z++) {
      const entity = scene.createEntity();
      entity.position.x = 1 * (x - size / 2);
      entity.position.y = 1 * y + 50;
      entity.position.z = 1 * (z - size / 2);

      entity.addComponent(VENTEA.Components.MeshRenderer, cube1);
      entity.addComponent(VENTEA.Components.BoxCollider, { x: 1, y: 1, z: 1 });
      entity.addComponent(VENTEA.Components.RigidBody, { type: 'dynamic' });
      test = entity;
    }
  }

  const sponza = scene.createEntity();
  sponza.addComponent(VENTEA.Components.MeshRenderer, mesh);
  sponza.addComponent(VENTEA.Components.MeshCollider, mesh);
  sponza.addComponent(VENTEA.Components.RigidBody, { type: 'static' });

  const sun = scene.createEntity();
  sun.position.x = -1;
  sun.position.y = -1;
  sun.position.z = -1;
  sun.addComponent(VENTEA.Components.DirectionalLight);

  let shader = await VENTEA.Shader.create('./assets/shader/shader.vert', './assets/shader/shader.frag');
  /*shader.addUniforms({
    Model: new Float32Array(16),
    View: new Float32Array(16),
    Projection: new Float32Array(16),
    u_Sampler: 0,
    u_Normal: 1,
    u_ShadowMap: 2
  });*/
  shader.addUniform('Model');
  shader.addUniform('View');
  shader.addUniform('Projection');
  shader.setInt('u_Sampler', 0);
  shader.setInt('u_Normal', 1);
  shader.setInt('u_ShadowMap1', 2);
  shader.setInt('u_ShadowMap2', 3);
  shader.setInt('u_ShadowMap3', 4);

  let post = await VENTEA.Shader.create('./assets/shader/post.vert', './assets/shader/post.frag');
  post.setInt('u_Color', 0);
  post.setInt('u_Depth', 1);
  post.setInt('u_Bloom', 2);

  let skybox = await VENTEA.Shader.create('./assets/shader/skybox.vert', './assets/shader/skybox.frag');
  skybox.addUniform('View');
  skybox.addUniform('Projection');

  let ground = await VENTEA.Shader.create('./assets/shader/terrain.vert', './assets/shader/terrain.frag');
  ground.addUniform('Model');
  ground.addUniform('View');
  ground.addUniform('Projection');
  ground.setInt('dirt_diff', 0);
  ground.setInt('dirt_norm', 1);

  ground.setInt('path_diff', 2);
  ground.setInt('path_norm', 3);

  ground.setInt('rock_diff', 4);
  ground.setInt('rock_norm', 5);

  ground.setInt('snow_diff', 6);
  ground.setInt('snow_norm', 7);

  ground.setInt('noise', 8);

  ground.setInt('skybox', 9);

  let shadow = await VENTEA.Shader.create('./assets/shader/shadow.vert', './assets/shader/shadow.frag');
  shadow.addUniform('Model');
  shadow.addUniform('LightSpace');
  shadow.setInt('u_Sample', 0);

  const getFrustumCornersWorldSpace = (view, zFar) => {
    let frustum = [];
    let inv = [];

    let proj = [];

    mat4.perspective(proj, glMatrix.toRadian(90), window.innerWidth / window.innerHeight, 0.1, zFar);

    mat4.multiply(inv, proj, view);
    mat4.invert(inv, inv);

    for (let x = 0; x < 2; ++x) {
      for (let y = 0; y < 2; ++y) {
        for (let z = 0; z < 2; ++z) {
          let pt = [];

          vec4.transformMat4(pt, [2.0 * x - 1.0, 2.0 * y - 1.0, 2.0 * z - 1.0, 1.0], inv);
          vec4.scale(pt, pt, 1 / pt[3]);
          frustum.push(pt);
        }
      }
    }

    return frustum;
  }

  const getCenter = (corners) => {
    let center = [0, 0, 0];
    for (const c of corners) {
      center[0] += c[0];
      center[1] += c[1];
      center[2] += c[2];
    }

    vec3.scale(center, center, 1 / corners.length);

    return center;
  }

  const getTightFrustum = (corners, lightView) => {
    let minX = Number.MAX_SAFE_INTEGER;
    let maxX = Number.MIN_SAFE_INTEGER;

    let minY = Number.MAX_SAFE_INTEGER;
    let maxY = Number.MIN_SAFE_INTEGER;

    let minZ = Number.MAX_SAFE_INTEGER;
    let maxZ = Number.MIN_SAFE_INTEGER;

    for (const c of corners) {
      let trf = [];
      vec4.transformMat4(trf, c, lightView);
      minX = Math.min(minX, trf[0]);
      maxX = Math.max(maxX, trf[0]);

      minY = Math.min(minY, trf[1]);
      maxY = Math.max(maxY, trf[1]);

      minZ = Math.min(minZ, trf[2]);
      maxZ = Math.max(maxZ, trf[2]);
    }

    const zMult = 10.0;
    if (minZ < 0) {
      minZ *= zMult;
    } else {
      minZ /= zMult;
    }

    if (maxZ < 0) {
      maxZ /= zMult;
    } else {
      maxZ *= zMult;
    }

    return { minX: minX, maxX: maxX, minY: minY, maxY: maxY, minZ: minZ, maxZ: maxZ };
  }

  let fbo = new VENTEA.Framebuffer(window.innerWidth, window.innerHeight, true);
  let fbo2 = new VENTEA.Framebuffer(window.innerWidth, window.innerHeight, true);
  let shadowMap1 = new VENTEA.Framebuffer(2048, 2048, true, false);
  let shadowMap2 = new VENTEA.Framebuffer(2048, 2048, true, false);
  let shadowMap3 = new VENTEA.Framebuffer(2048, 2048, true, false);
  let bloom = await VENTEA.BloomPass.create(window.innerWidth, window.innerHeight, 6);
  //let shad = await VENTEA.ShadowPass.create(window.innerWidth, window.innerHeight, 6);

  function stateReset(gl) {
    var numTextureUnits = gl.getParameter(gl.MAX_TEXTURE_IMAGE_UNITS)
    for (var ii = 0; ii < numTextureUnits; ++ii) {
      gl.activeTexture(gl.TEXTURE0 + ii)
      gl.bindTexture(gl.TEXTURE_CUBE_MAP, null)
      gl.bindTexture(gl.TEXTURE_2D, null)
    }

    gl.activeTexture(gl.TEXTURE0)
    gl.useProgram(null)
    gl.bindBuffer(gl.ARRAY_BUFFER, null)
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null)
    gl.bindFramebuffer(gl.FRAMEBUFFER, null)
    gl.bindRenderbuffer(gl.RENDERBUFFER, null)
    gl.blendColor(0, 0, 0, 0)
    gl.blendEquation(gl.FUNC_ADD)
    gl.blendFunc(gl.ONE, gl.ZERO)
    gl.clearColor(0, 0, 0, 0)

    return gl
  }

  //const coordinates = document.getElementById('coordinates');

  const calculateLightMtrix = (camera, lightDir, far) => {
    let lightProjection = mat4.create();
    let lightView = mat4.create();
    let lightSpaceMatrix = mat4.create();

    const corners = getFrustumCornersWorldSpace(camera.getView(), far);
    const center = getCenter(corners);
    const test = [center[0] - lightDir.x, center[1] - lightDir.y, center[2] - lightDir.z];
    mat4.lookAt(lightView, test, center, [0, 1, 0]);
    const frustum = getTightFrustum(corners, lightView);
    mat4.ortho(lightProjection, frustum.minX, frustum.maxX, frustum.minY, frustum.maxY, frustum.minZ, frustum.maxZ);
    mat4.multiply(lightSpaceMatrix, lightProjection, lightView);

    return lightSpaceMatrix;
  }

  const loop = (time) => {
    /** Update Controls */
    control.update();

    VENTEA.Renderer.startDebug(scene, time, canvas);

    const tod = (time / 5000) % Math.PI;
    const lightDir = [Math.cos(tod), -Math.sin(tod), 0];

    ventea.surface.resize(window.innerWidth, window.innerHeight);

    gl.clearColor(0.3, 0.56, 1.0, 1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);


    const lightMatrices = [calculateLightMtrix(scene.camera, sun.position, 10),
    calculateLightMtrix(scene.camera, sun.position, 25),
    calculateLightMtrix(scene.camera, sun.position, 50)];
    //Shadow 1
    shadow.bind();
    shadow.setMat4('LightSpace', lightMatrices[0]);
    shadowMap1.bind();
    VENTEA.Renderer.renderScene(shadow, scene, time);
    shadowMap1.unbind();
    //Shadow 2
    shadow.bind();
    shadow.setMat4('LightSpace', lightMatrices[1]);
    shadowMap2.bind();
    VENTEA.Renderer.renderScene(shadow, scene, time);
    shadowMap2.unbind();
    //Shadow 3
    shadow.bind();
    shadow.setMat4('LightSpace', lightMatrices[2]);
    shadowMap3.bind();
    VENTEA.Renderer.renderScene(shadow, scene, time);
    shadowMap3.unbind();

    gl.clearColor(0.3, 0.56, 1.0, 1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    fbo.bind();
    shader.setMat4('LightSpace[0]', lightMatrices[0]);
    shader.setMat4('LightSpace[1]', lightMatrices[1]);
    shader.setMat4('LightSpace[2]', lightMatrices[2]);
    shader.setFloat('FarPlane', 500.0);
    shader.setFloat('CascadeDistances[0]', 10.0);
    shader.setFloat('CascadeDistances[1]', 50.0);
    shader.setFloat('CascadeDistances[2]', 500.0);
    shader.setInt('CascadeCount', 3);

    shader.setVec3('LightDirection', [sun.position.x, sun.position.y, sun.position.z]);
    shadowMap1.depthTexture.bindTexture(2);
    shadowMap2.depthTexture.bindTexture(3);
    shadowMap3.depthTexture.bindTexture(4);
    VENTEA.Renderer.renderScene(shader, scene, time);

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

    /*post.bind();
    gl.clearColor(0.3, 0.56, 1.0, 1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    fbo.colorTexture.bindTexture(0);
    fbo.depthTexture.bindTexture(1);
    //gl.viewport(400, 0, canvas.width - 400, canvas.height);

    VENTEA.Renderer.drawQuad();
    post.unbind();*/

    fbo2.bind();
    bloom.shader.bind();
    bloom.shader.setInt('u_Stage', 1);
    fbo.colorTexture.bindTexture(0);
    fbo.depthTexture.bindTexture(1);
    VENTEA.Renderer.drawQuad();
    fbo2.unbind();

    bloom.bind();
    fbo2.colorTexture.bindTexture(0);
    fbo2.depthTexture.bindTexture(1);
    bloom.draw();
    bloom.shader.unbind();
    bloom.unbind();

    post.bind();
    fbo.colorTexture.bindTexture(0);
    fbo.depthTexture.bindTexture(1);
    bloom.bindBloom(2);
    VENTEA.Renderer.drawQuad();
    post.unbind();

    VENTEA.Renderer.endDebug();

    stateReset(gl);

    requestAnimationFrame(loop);
  }

  requestAnimationFrame(loop);
}