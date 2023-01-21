Physics.post({
    m: 'addGround', o: {
      width: terrain.width,
      depth: terrain.depth,
      heightData: terrain.heightMap,
      vertices: terrain.vertices,
      indices: terrain.indices
    }
  });
  
  {
    let height = 5;
  
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
  
    /*Physics.add({
      shape: 'capsule',
      size: [0.5, 1.95, 0.5],
      pos: [0, 0.975, 0],
      rot: [0, 0, 0, 1],
      density: 100,
      friction: 0.2,
      restitution: 0.1,
      type: 'static'
    });*/
  
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

















  // DRAW CALLS
    /*const alpha = 50 * ((time - Physics.lastTime) / 1000);
  const tod = (time / 5000) % Math.PI;

  let oldCamPos = Physics.controller[0];
  let newCamPos = Physics.controller[1];

  const x = (Math.round(newCamPos[0] * 100) / 100).toFixed(2);
  const y = (Math.round(newCamPos[1] * 100) / 100).toFixed(2);
  const z = (Math.round(newCamPos[2] * 100) / 100).toFixed(2);

  fuck.innerHTML = `${x}, ${y}, ${z}`;

  let camPos = [lerp(oldCamPos[0], newCamPos[0], alpha),
  lerp(oldCamPos[1], newCamPos[1], alpha),
  lerp(oldCamPos[2], newCamPos[2], alpha)];
  //camPos[1] += 1.7;

  camera.setPos(camPos);

  // Render Scene

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

  // Skybox

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
  fbo.draw();*/



  const clamp = (num, min, max) => Math.min(Math.max(num, min), max);

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
      default: /*cube.draw();*/ break;
    }
  }

  if (shadow) {
    shader.setMat4('Model', mat4.fromRotationTranslationScale([], [0, 0, 0, 1], [shadow[0], shadow[1] - 1.7, shadow[2]], [2, 2, 2]));
    capsule.draw();
  }
}
