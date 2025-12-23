import * as VENTEA from 'ventea';

import noise from './perlin';

const canvas = document.createElement('canvas');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

document.body.appendChild(canvas);

canvas.onclick = () => {
    canvas.requestPointerLock();
};

const generateTerrain = (width: number, depth: number): VENTEA.MeshData => {
    noise.seed(Math.random());

    const positions = new Float32Array(width * depth * 3);
    const texCoords = new Float32Array(width * depth * 2);

    const indices = new Uint32Array((width - 1) * (depth - 1) * 6);

    let i = 0;
    let t = 0;

    for (let z = 0; z < depth; z++) {
        for (let x = 0; x < width; x++) {
            positions[i++] = x - width / 2;
            positions[i++] = noise.octaveSimple2(x / width, z / depth, 5) * 50;
            positions[i++] = z - depth / 2;

            texCoords[t++] = x / width * 64;
            texCoords[t++] = z / depth * 64;
        }
    }

    i = 0;

    for (let z = 0; z < depth - 1; z++) {
        for (let x = 0; x < width - 1; x++) {

            let row1 = z * (width);
            let row2 = (z + 1) * (width);

            indices[i++] = row1 + x;
            indices[i++] = row2 + x;
            indices[i++] = row2 + x + 1;

            indices[i++] = row1 + x;
            indices[i++] = row2 + x + 1;
            indices[i++] = row1 + x + 1;
        }
    }

    const meshData = new VENTEA.MeshData(positions, undefined, texCoords, indices);
    meshData.recalculateNormals();

    console.log(meshData);

    return meshData;
}

const BLADE_WIDTH = 0.1
const BLADE_HEIGHT = 0.8
const BLADE_HEIGHT_VARIATION = 0.6
const BLADE_VERTEX_COUNT = 5
const BLADE_TIP_OFFSET = 0.1

function interpolate(val: number, oldMin: number, oldMax: number, newMin: number, newMax: number) {
  return ((val - oldMin) * (newMax - newMin)) / (oldMax - oldMin) + newMin
}

function computeBlade(center: number[], index: number = 0) {
    const height = BLADE_HEIGHT + Math.random() * BLADE_HEIGHT_VARIATION
    const vIndex = index * BLADE_VERTEX_COUNT

    // Randomize blade orientation and tip angle
    const yaw = Math.random() * Math.PI * 2
    const yawVec = [Math.sin(yaw), 0, -Math.cos(yaw)]
    const bend = Math.random() * Math.PI * 2
    const bendVec = [Math.sin(bend), 0, -Math.cos(bend)]

    // Calc bottom, middle, and tip vertices
    const bl = yawVec.map((n, i) => n * (BLADE_WIDTH / 2) * 1 + center[i])
    const br = yawVec.map((n, i) => n * (BLADE_WIDTH / 2) * -1 + center[i])
    const tl = yawVec.map((n, i) => n * (BLADE_WIDTH / 4) * 1 + center[i])
    const tr = yawVec.map((n, i) => n * (BLADE_WIDTH / 4) * -1 + center[i])
    const tc = bendVec.map((n, i) => n * BLADE_TIP_OFFSET + center[i])

    // Attenuate height
    tl[1] += height / 2
    tr[1] += height / 2
    tc[1] += height

    return {
      positions: [...bl, ...br, ...tr, ...tl, ...tc],
      indices: [
        vIndex,
        vIndex + 1,
        vIndex + 2,
        vIndex + 2,
        vIndex + 4,
        vIndex + 3,
        vIndex + 3,
        vIndex,
        vIndex + 2
      ]
    }
  }

export class GrassGeometry extends VENTEA.MeshData {
  constructor(size: number, count: number) {
    const positions = []
    const uvs = []
    const indices = []

    for (let i = 0; i < count; i++) {
      const surfaceMin = (size / 2) * -1
      const surfaceMax = size / 2
      const radius = (size / 2) * Math.random()
      const theta = Math.random() * 2 * Math.PI

      const x = radius * Math.cos(theta)
      const y = radius * Math.sin(theta)

      uvs.push(
        ...Array.from({ length: BLADE_VERTEX_COUNT }).flatMap(() => [
          interpolate(x, surfaceMin, surfaceMax, 0, 1),
          interpolate(y, surfaceMin, surfaceMax, 0, 1)
        ])
      )

      const blade = computeBlade([x, 0, y], i)
      positions.push(...blade.positions)
      indices.push(...blade.indices)
    }

    super(new Float32Array(positions), undefined, new Float32Array(uvs), new Uint32Array(indices));

    this.recalculateNormals();
  }

  // Grass blade generation, covered in https://smythdesign.com/blog/stylized-grass-webgl
  // TODO: reduce vertex count, optimize & possibly move to GPU
  
}

class Grass extends VENTEA.Mesh {
  constructor(size: number, count: number) {
    const vs = `#version 300 es
    precision highp float;
    
    layout(location = 0) in vec3 position;
    layout(location = 1) in vec3 normal;
    layout(location = 2) in vec2 tex_coord;
    // layout(location = 3) in mat4 transform;
    
    out vec3 v_FragPos;
    out vec3 v_Normal;
    out vec2 v_TexCoord;
    
    uniform mat4 view;
    uniform mat4 proj;
    uniform mat4 model;
    
    uniform int offset;
    
    uniform sampler2D transformTexture;

    uniform float uTime;

    float wave(float waveSize, float tipDistance, float centerDistance) {
        // Tip is the fifth vertex drawn per blade
        bool isTip = (gl_VertexID + 1) % 5 == 0;
    
        float waveDistance = isTip ? tipDistance : centerDistance;
        return sin((uTime / 500.0) + waveSize) * waveDistance;
    }
    
    void main() {
        int pid = 4 * offset + 4 * gl_InstanceID;
        int w = 512;
        int h = 512;
        ivec2 p1 = ivec2((pid + 0) % w, (pid + 0) / w);
        ivec2 p2 = ivec2((pid + 1) % w, (pid + 1) / w);
        ivec2 p3 = ivec2((pid + 2) % w, (pid + 2) / w);
        ivec2 p4 = ivec2((pid + 3) % w, (pid + 3) / w);
    
        mat4 transform = mat4(
            texelFetch(transformTexture, p1, 0),
            texelFetch(transformTexture, p2, 0),
            texelFetch(transformTexture, p3, 0),
            texelFetch(transformTexture, p4, 0)
        );
    
        // mat4 transform = mat4(vec4(1,0,0,0), vec4(0,1,0,0), vec4(0,0,1,0), vec4(0,0,0,1));
    
        // vec4 local = transform * vec4(position, 1.0);
    
        v_FragPos = position;
        v_Normal = mat3(transpose(inverse(transform))) * normal;
        v_TexCoord = tex_coord;

        if (v_FragPos.y < 0.0) {
            v_FragPos.y = 0.0;
        } else {
            v_FragPos.x += wave(v_TexCoord.x * 10.0, 0.3, 0.1);      
        }
    
        vec4 pos = proj * view * transform * vec4(v_FragPos, 1.0);
        gl_Position = pos;
    }
    `;

    const fs = `#version 300 es
    precision highp float;
    
    in vec3 v_FragPos;
    in vec3 v_Normal;
    in vec2 v_TexCoord;
    
    layout(location = 0) out vec4 color;
    
    uniform mat4 view;
    uniform mat4 proj;
    uniform mat4 model;

    uniform float uTime;
    const vec2 resolution = vec2(2000.0, 300.0);
    vec3 green = vec3(0.2, 0.6, 0.3);

    void main() {
      vec3 final = mix(green * 0.7, green, v_FragPos.y);
    //   final = mix(color, texture2D(uCloud, vUv).rgb, 0.4);
  
      float lighting = normalize(dot(v_Normal, vec3(10.0)));
      color = vec4(final + lighting * 0.03, 1.0);
    }
    `;

    const material = new VENTEA.PBRShaderMaterial({
    });
    material.shader = new VENTEA.Shader('GrassShader', vs, fs);

    const geometry = new GrassGeometry(size, count);
    super(geometry, material);
  }

  update(time: number) {
    this.material?.shader._impl.setFloat('uTime', time);
  }
}

(async () => {
    const engine = new VENTEA.Engine(canvas);
    await engine.init({
        api: VENTEA.API.WebGL,
        physics: true
    });

    const camera = new VENTEA.PerspectiveCamera(90, canvas.width / canvas.height, 0.01, 1000.0);
    const skyboxTexture = await VENTEA.Resources.loadTexture('FS003_Day_Sunless.png', {
        mip: false
    });

    const controls = new VENTEA.FirstPersonControls(camera);
    controls.update();

    const scene = new VENTEA.Scene();
    scene.background = skyboxTexture;

    const player = scene.createEntity('Player');
    player.position.set(0, 10, 0);
    player
        .addComponent(VENTEA.CapsuleCollider, { radius: 0.35, halfHeight: 0.55 })
        .addComponent(VENTEA.RigidBody, { type: VENTEA.BodyType.Dynamic, restitution: 0 });
    VENTEA.Physics.lockRotation(player.handle);

    const light = scene.createEntity('Light');
    // light.addComponent(VENTEA.Light, { r: 0.15, g: 0.10, b: 0.3, type: VENTEA.LightType.Directional });
    light.addComponent(VENTEA.Light, { r: 1, g: 1, b: 1, type: VENTEA.LightType.Directional });
    light.position.set(-1, 1, 1);

    const skyMaterial = new VENTEA.PBRShaderMaterial({
        albedoTexture: skyboxTexture
    });

    const light2 = scene.createEntity('Light');
    const aaa = new VENTEA.Mesh(new VENTEA.SphereMesh(0.1), skyMaterial);
    light2
        .addComponent(VENTEA.MeshRenderer, aaa)
        .addComponent(VENTEA.Light, { r: 0, g: 0, b: 0, type: VENTEA.LightType.Point });

    controls.target = player.position;

    const texture = new VENTEA.Texture2D(2, 2, VENTEA.TextureFormat.BGRA8UNORM, {
        magFilter: VENTEA.SamplerFilter.Nearest
    });
    
    // texture.setData(new Uint8Array([
    //     255, 102, 159, 255, 255, 159, 102, 255, 236, 255, 102, 255, 121, 255, 102, 255, 102, 255,
    //     198, 255, 102, 198, 255, 255, 121, 102, 255, 255, 236, 102, 255, 255
    // ]));

    texture.setData(new Uint8Array([0, 0, 0, 255, 255, 255, 255, 255, 255, 255, 255, 255, 0, 0, 0, 255
    ]));

    const terrainMaterial = new VENTEA.PBRShaderMaterial({
        albedoTexture: texture,
        metalnessFactor: 0,
        roughnessFactor: 1
    });

    const terrain = new VENTEA.Mesh(new VENTEA.PlaneMesh(30, 30), terrainMaterial);

    const map = scene.createEntity('Map');
    map.rotation.x = -Math.PI / 2;
    // map.scale.set(10, 10, 10);
    map.addComponent(VENTEA.MeshRenderer, terrain)
        .addComponent(VENTEA.MeshCollider, terrain)
        .addComponent(VENTEA.RigidBody, { type: VENTEA.BodyType.Static });
        // const treeMesh = await VENTEA.Resources.loadGLTF('tree.glb');
        // const tree = scene.createEntity('Tree');
        // tree.addComponent(VENTEA.MeshRenderer, treeMesh);
        // tree.scale.set(100, 100, 100);
    const grass = new Grass(30, 100000);

    const g = scene.createEntity('Grass');
    g.addComponent(VENTEA.MeshRenderer, grass);
    g.position.set(0, 0, 0);

    

    window.addEventListener('resize', (e) => {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        camera.aspect = canvas.width / canvas.height;
        camera.updateProjection();

        VENTEA.Renderer.resize(window.innerWidth, window.innerHeight);
    });

    const render = (time: number) => {
        //TODO: ugly
        const alpha = VENTEA.Utils.clamp(50 * ((time - VENTEA.Physics.lastTime) / 1000), 0, 1);

        const xp = VENTEA.Utils.lerp(VENTEA.LastPosition.x[player.handle], player.position.x, alpha);
        const yp = VENTEA.Utils.lerp(VENTEA.LastPosition.y[player.handle], player.position.y, alpha);
        const zp = VENTEA.Utils.lerp(VENTEA.LastPosition.z[player.handle], player.position.z, alpha);

        controls.target = new VENTEA.Vector3(xp, yp + 0.4, zp);

        controls.update();

        grass.update(time);

        // light.position.set(3 * Math.cos(time / 1000), 1, 3 * Math.sin(time / 1000));

        const velocity = player.getComponent(VENTEA.Velocity);

        let newY = velocity!.y!;

        if (VENTEA.Input.isKeyDown('Space')) {
            newY = 4;
        }

        const x = Math.sin(camera.yaw);
        const z = -Math.cos(camera.yaw);

        let velX = 0;
        let velZ = 0;

        if (VENTEA.Input.isKeyDown('KeyW')) {
            velX += x;
            velZ += z;
        }

        if (VENTEA.Input.isKeyDown('KeyA')) {
            velX += z;
            velZ += -x;
        }

        if (VENTEA.Input.isKeyDown('KeyS')) {
            velX += -x;
            velZ += -z;
        }

        if (VENTEA.Input.isKeyDown('KeyD')) {
            velX += -z;
            velZ += x;
        }

        const mag = Math.sqrt(velX * velX + velZ * velZ);

        if (mag > 0) {
            velX /= mag;
            velZ /= mag;
        }

        const newX = velocity!.x / 2 + 2 * velX;
        const newZ = velocity!.z / 2 + 2 * velZ;
        VENTEA.Physics.setLinearVelocity(player.handle, new VENTEA.Vector3(newX, newY, newZ));

        VENTEA.Renderer.renderScene(scene, time, camera);

        requestAnimationFrame(render);
    }

    requestAnimationFrame(render);
})();
