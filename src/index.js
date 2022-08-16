import { Ventea, Capsule, Cube, Cubemap, Mesh, Sphere, Terrain, GltfLoader, Camera, Shader, Controller, Framebuffer, Scene, BlurPass } from "./Ventea.js";
import { Position, Velocity, Rotation, Size, RigidBody, LastPosition } from "./Components.js"
import { defineQuery } from "../lib/bitECS/index.mjs";
import { Physics } from "./Physics.js";
import { glMatrix, mat4, vec3, vec4 } from "../lib/gl-matrix/index.js";
import { BloomPass } from "./BloomPass.js";

const ventea = new Ventea('surface', window.innerWidth, window.innerHeight);
await ventea.init();

//const tm = new TextureManager();
const loader = new GltfLoader();
let uri = './assets/Sponza.glb';
console.time("---Loading Mesh---");
let mesh = await Mesh.create(uri, loader);
//let venti = await Mesh.create('./assets/Venti.glb', loader);
console.timeEnd("---Loading Mesh---");
let capsule = await Capsule.create();
let cube = await Cube.create();
let sphere = await Sphere.create(1.0);
let cubemap = await Cubemap.create(['./assets/skybox/right.jpg', './assets/skybox/left.jpg', './assets/skybox/top.jpg', './assets/skybox/bottom.jpg', './assets/skybox/front.jpg', './assets/skybox/back.jpg']);
console.time("---Loading Terrain---");
let terrain = await new Terrain(300, 300);
let terrainMesh = await terrain.createMesh();
console.timeEnd("---Loading Terrain---");
let fuck = document.getElementById('fuck');

class GameScene extends Scene {
  constructor() {
    super();

    Physics.post({
      m: 'addGround', o: {
        width: terrain.width,
        depth: terrain.depth,
        heightData: terrain.heightMap,
        vertices: terrain.vertices,
        indices: terrain.indices
      }
    });
  }

  run(time) {

  }
}
let haha = new GameScene();
ventea.scene = haha;
ventea.run();

{
let height = 0;

for (let y = 0; y < height; y++) {
  let size = (2 * height - 1) - (2 * y);
  for (let x = 0; x < size; x++) for (let z = 0; z < size; z++) {

    Physics.add({
      shape: 'box',
      size: [1, 1, 1],
      pos: [1 * (x - size / 2), 1 * y + 50.5, 1 * (z - size / 2)],
      density: 10,
      friction: 0.5,
      restitution: 0.4
    });
  }
}

console.log(Physics.bodies.length);

let grid = 0;
let sq = Math.sqrt(grid);

for (let i = 0; i < grid; i++) {
  let x = ((i / grid) * terrain.width)
  let z = (((i % sq) / sq) * terrain.width);
  let y = 100 * terrain.heightMap[terrain.depth * x + z] + 5;
  Physics.add({
    shape: 'sphere',
    size: [2, 2, 2],
    pos: [x - terrain.width / 2, 50, z - terrain.depth / 2],
    density: 1,
    friction: 0.8,
    restitution: 1.0
  });
}

Physics.add({
  shape: 'capsule',
  size: [0.5, 1.95, 0.5],
  pos: [0, 0.975, 0],
  rot: [0, 0, 0, 1],
  density: 100,
  friction: 0.2,
  restitution: 0.1,
  type: 'static'
});

for (const p of mesh.primitives) {
  Physics.add({
    shape: 'mesh',
    size: [1, 1, 1],
    pos: [0, 0, 0],
    rot: [0, 0, 0, 1],
    vertices: p.positions,
    indices: p.indices,
    density: 100,
    friction: 0.2,
    restitution: 1.0,
    type: 'static'
  });
}
}

var spector = new SPECTOR.Spector();
spector.displayUI();

let camera = new Camera(glMatrix.toRadian(90), window.innerWidth / window.innerHeight, 0.1, 500);
let control = new Controller(camera, ventea);

let shader = await Shader.create('./assets/shader/shader.vert', './assets/shader/shader.frag');
shader.addUniform('Model');
shader.addUniform('View');
shader.addUniform('Projection');
shader.setInt('sampler', 0);
shader.setInt('u_Normal', 1);
shader.setInt('shadowMap', 2);

let post = await Shader.create('./assets/shader/post.vert', './assets/shader/post.frag');
post.setInt('u_Color', 0);
post.setInt('u_Depth', 1);
post.setInt('u_Bloom', 2);

let skybox = await Shader.create('./assets/shader/skybox.vert', './assets/shader/skybox.frag');
skybox.addUniform('View');
skybox.addUniform('Projection');

let ground = await Shader.create('./assets/shader/terrain.vert', './assets/shader/terrain.frag');
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

let shadow = await Shader.create('./assets/shader/shadow.vert', './assets/shader/shadow.frag');
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

let fbo = await Framebuffer.create(window.innerWidth, window.innerHeight, true);
let fbo2 = await Framebuffer.create(window.innerWidth, window.innerHeight, true);
let shadowMap1 = await Framebuffer.create(2048, 2048, true, false);
let shadowMap2 = await Framebuffer.create(2048, 2048, true, false);
let shadowMap3 = await Framebuffer.create(2048, 2048, true, false);
let bloom = await BloomPass.create(window.innerWidth, window.innerHeight, 6);

gl.enable(gl.DEPTH_TEST);
gl.enable(gl.BLEND);
gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

const clamp = (num, min, max) => Math.min(Math.max(num, min), max);

let trees = [];

for (let z = 0; z < terrain.depth; z += Math.floor(Math.random() * 50)) {
  for (let x = 0; x < terrain.width; x += Math.floor(Math.random() * 50)) {
    let y = terrain.heightMap[x * terrain.width + z];
    if (y / 100 > 0.1)
      trees.push([x - terrain.width / 2, y, z - terrain.depth / 2]);
  }
}

//let rot = [];
//let pos = [];
gl.enable(gl.CULL_FACE);
gl.cullFace(gl.BACK);
gl.frontFace(gl.CCW);

let lastTime = 0;

const lerp = (a, b, t) => (1 - t) * a + t * b;

let pos = [];
let lastPos = [];
let rot = [];
let size = [];
let newPos = [];
let model = mat4.create();
let lightPos = [0, 1, 0];

const drawScene = (alpha, shader, shadow = null) => {
  /*ground.bind();
  ground.setMat4('View', camera.getView());
  ground.setMat4('Projection', camera.getProjection());
  ground.setMat4('Model', mat4.create());
  terrain.dirt_diff.bindLocation(0);
  terrain.dirt_norm.bindLocation(1);

  terrain.path_diff.bindLocation(2);
  terrain.path_norm.bindLocation(3);

  terrain.rock_diff.bindLocation(4);
  terrain.rock_norm.bindLocation(5);

  terrain.snow_diff.bindLocation(6);
  terrain.snow_norm.bindLocation(7);

  terrain.noise.bindLocation(8);

  cubemap.bindLocation(9);*/

  //gl.disable(gl.CULL_FACE);  

  shader.bind();

  shader.setMat4('Model', mat4.create());
  terrainMesh.draw();

  shader.setMat4('Model', mat4.fromRotationTranslationScale([], [0, 0, 0, 1], [0, 0, 0], [1, 1, 1]));
  mesh.draw();

  cubemap.bindTexture();

  const physicsQuery = defineQuery([RigidBody]);
  const ents = physicsQuery(haha.world);

  for (const eid of ents) {
    pos = [Position.x[eid], Position.y[eid], Position.z[eid]];
    lastPos = [LastPosition.x[eid], LastPosition.y[eid], LastPosition.z[eid]];

    rot = [Rotation.x[eid], Rotation.y[eid], Rotation.z[eid], Rotation.w[eid]];
    size = [Size.x[eid], Size.y[eid], Size.z[eid]];
    let shape = RigidBody.shape[eid];

    newPos = [lerp(lastPos[0], pos[0], alpha),
    lerp(lastPos[1], pos[1], alpha),
    lerp(lastPos[2], pos[2], alpha)];

    mat4.fromRotationTranslationScale(model, rot, newPos, size);
    shader.setMat4('Model', model);
    switch (shape) {
      case 0: cube.draw(); break;
      case 1: sphere.draw(); break;
      case 2: capsule.draw(); break;
      //case 3: mesh.draw(); break;
      default: cube.draw(); break;
    }
  }

  if(shadow) {
    shader.setMat4('Model', mat4.fromRotationTranslationScale([], [0, 0, 0, 1], [shadow[0], shadow[1] - 1.7, shadow[2]], [2,2,2]));
    capsule.draw();
  }
}

let loop = (time) => {
  /** Update Controls */
  control.update();

  const alpha = 50 * ((time - Physics.lastTime) / 1000);
  const tod = (time / 5000) % Math.PI;

  fuck.innerHTML = Physics.controller[1];

  let oldCamPos = Physics.controller[0];
  let newCamPos = Physics.controller[1];

  let camPos = [lerp(oldCamPos[0], newCamPos[0], alpha),
  lerp(oldCamPos[1], newCamPos[1], alpha),
  lerp(oldCamPos[2], newCamPos[2], alpha)];
  //camPos[1] += 1.7;

  camera.setPos(camPos);

  /** Render Scene */

  gl.clearColor(0.1, 0.1, 0.1, 1.0);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  //const test = [camPos[0] + lightDir[0], camPos[1] + lightDir[1], camPos[2]];
  const lightDir = [Math.cos(tod), -Math.sin(tod), 0];

  //Shadow Pass
  //gl.enable(gl.DEPTH_TEST);
  //gl.cullFace(gl.FRONT);
  let lightProjection = mat4.create();
  let lightView = mat4.create();
  let lightSpaceMatrix = mat4.create();

  let corners = getFrustumCornersWorldSpace(camera.getView(), 10);
  let center  = getCenter(corners);
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

  for (const tree of trees) {
    mat4.fromRotationTranslationScale(model, [0, 0, 0, 1], tree, [0.01, 0.01, 0.01]);
    //shader.setMat4('Model', model);
    //mesh.draw();
  }

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

  //post.bind();
  //fbo.colorTexture.bindTexture(0);
  //fbo.depthTexture.bindTexture(1);
  //fbo.draw();
  /*fbo2.bind();
  post.setVec2('u_Direction', [1, 0]);
  fbo.colorTexture.bindTexture(0);
  fbo.depthTexture.bindTexture(1);
  fbo.draw();
  fbo2.unbind();

  fbo.bind();
  post.setVec2('u_Direction', [-1, 0]);
  fbo2.colorTexture.bindTexture(0);
  fbo2.depthTexture.bindTexture(1);
  fbo2.draw();
  fbo.unbind();

  fbo2.bind();
  post.setVec2('u_Direction', [0, 1]);
  fbo.colorTexture.bindTexture(0);
  fbo.depthTexture.bindTexture(1);
  fbo.draw();
  fbo2.unbind();

  fbo.bind();
  post.setVec2('u_Direction', [0, -1]);
  fbo2.colorTexture.bindTexture(0);
  fbo2.depthTexture.bindTexture(1);
  fbo2.draw();
  fbo.unbind();

  fbo.colorTexture.bindTexture(0);
  fbo.depthTexture.bindTexture(1);
  fbo.draw();*/

  //shadowMap1.depthTexture.bindTexture();
  //shadowMap1.draw();

  requestAnimationFrame(loop);
}

requestAnimationFrame(loop);
