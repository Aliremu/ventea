import * as VENTEA from 'ventea';
import GUI from 'lil-gui';

const canvas = document.createElement('canvas');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

document.body.appendChild(canvas);

canvas.onclick = () => {
    canvas.requestPointerLock();
};

class Boid {
    public direction: VENTEA.Vector3;

    public velocity: VENTEA.Vector3;
    public acceleration: VENTEA.Vector3;

    public flockHeading: VENTEA.Vector3;
    public flockCenter: VENTEA.Vector3;
    public avoidanceHeading: VENTEA.Vector3;
    public flockmates: number;

    public static speed = 7;
    public static alignmentWeight = 0.5;
    public static cohesionWeight = 0.5;
    public static seperationWeight = 1;
    public static wallWeight = 1;
    public static steerWeight = 1;

    public static target: VENTEA.Vector3 | undefined;

    public static bounds: VENTEA.Vector3 = new VENTEA.Vector3(50, 20, 20);

    constructor(public entity: VENTEA.Entity, direction: VENTEA.Vector3) {
        this.direction = direction;
        this.velocity = direction.clone().mul(Boid.speed);
        this.acceleration = new VENTEA.Vector3();

        this.flockHeading = new VENTEA.Vector3();
        this.flockCenter = new VENTEA.Vector3();
        this.avoidanceHeading = new VENTEA.Vector3();
        this.flockmates = 0;
    }

    update() {
        const acceleration = new VENTEA.Vector3();
        const dt = 1 / 60;

        if(Boid.target) {
            const targetForce = Boid.target.clone().sub(this.entity.position).mul(0.5);
            acceleration.add(targetForce);
        }

        if (this.flockmates != 0) {
            this.flockCenter.mul(1 / this.flockmates);

            const alignmentForce = this.steerTowards(this.flockHeading).mul(Boid.alignmentWeight);
            const cohesionForce = this.steerTowards(this.flockCenter.clone().sub(this.entity.position)).mul(Boid.cohesionWeight);
            const seperationForce = this.steerTowards(this.avoidanceHeading).mul(Boid.seperationWeight);

            acceleration.add(alignmentForce);
            acceleration.add(cohesionForce);
            acceleration.add(seperationForce);
        }

        const margin = 3;
        const a = new VENTEA.Vector3(margin);
        const b = Boid.bounds.clone().sub(margin);
        const pos = this.entity.position;

        const offset = Boid.bounds.clone().mul(1/2).sub(this.entity.position);

        if(pos.x < a.x || pos.y < a.y || pos.z < a.z || 
           pos.x > b.x || pos.y > b.y || pos.z > b.z) {
            let distance = Math.min(pos.x, pos.y, pos.z, Boid.bounds.x - pos.x, Boid.bounds.y - pos.y, Boid.bounds.z - pos.z);
            if(distance <= 0.5) distance = 100;

            const wallForce = offset.mul(Boid.wallWeight * Math.abs(distance));
            acceleration.add(wallForce);
        }
        
        this.velocity.add(acceleration.clone().mul(dt));
        const speed = this.velocity.length();
        const dir = this.velocity.clone().mul(1 / speed);
        this.velocity = dir.clone().mul(Boid.speed);

        const newPosition = this.velocity.clone().mul(dt).add(this.entity.position);

        const y = Math.atan2(dir.x, dir.z);
        const p = Math.asin(dir.y);

        this.entity.position.set(newPosition.x, newPosition.y, newPosition.z);
        this.entity.rotation.set(-p, y, 0);
        this.direction = dir;
    }

    steerTowards(vector: VENTEA.Vector3) {
        if (vector.length() == 0) return new VENTEA.Vector3();

        return vector.normalized.mul(Boid.speed).sub(this.velocity);
    }
}

(async () => {
    const engine = new VENTEA.Engine(canvas);
    await engine.init({
        api: VENTEA.API.WebGPU,
        physics: false
    });

    const camera = new VENTEA.PerspectiveCamera(90, canvas.width / canvas.height, 0.01, 1000.0);
    const controls = new VENTEA.FirstPersonControls(camera);
    controls.update();

    const src = await (await fetch('boids.wgsl')).text();

    const MAX_BOIDS = 5000;

    const settings = {
        useCompute: true,
        nbBoids: 500,
        viewRadius: 7,
        avoidRadius: 5,
        followPlayer: false
    };
    const computeShader = new VENTEA.ComputeShader(src);
    const outputBuffer = new VENTEA.ComputeBuffer(MAX_BOIDS, 80);
    const inputBuffer = new VENTEA.ComputeBuffer(MAX_BOIDS, 80);
    const sceneBuffer = new VENTEA.ComputeBuffer(1, 12);

    const sceneData = new Float32Array([settings.nbBoids, settings.viewRadius, settings.avoidRadius]);
    sceneBuffer.setData(0, sceneData);

    const scene = new VENTEA.Scene();

    const mesh = await VENTEA.Resources.load(VENTEA.GLTFMesh, 'fish2.glb');

    const random = (min: number, max: number) => Math.random() * (max - min) + min;

    const boids: Boid[] = [];

    let inputBoids = new Float32Array(MAX_BOIDS * 20);
    for (let i = 0; i < MAX_BOIDS; i++) {
        const entity = scene.createEntity();
        entity.addComponent(VENTEA.MeshRenderer, mesh);

        const { x: w, y: h, z: d } = Boid.bounds;
        const x = random(0, w);
        const y = random(0, h);
        const z = random(0, d);

        const dx = random(-1, 1);
        const dy = random(-1, 1);
        const dz = random(-1, 1);

        inputBoids[i * 20 + 0] = x; // position.x
        inputBoids[i * 20 + 1] = y; // position.y
        inputBoids[i * 20 + 2] = z; // position.z
        inputBoids[i * 20 + 4] = dx; // direction.x
        inputBoids[i * 20 + 5] = dy; // direction.y
        inputBoids[i * 20 + 6] = dz; // direction.z

        entity.position.set(x, y, z);

        const boid = new Boid(entity, new VENTEA.Vector3(dx, dy, dz));
        boids.push(boid);

        if(i >= settings.nbBoids) {
            entity.isVisible = false;
        }
    }

    inputBuffer.setData(0, inputBoids);

    computeShader.setBuffer("input", inputBuffer);
    computeShader.setBuffer("output", outputBuffer);
    computeShader.setBuffer("scene", sceneBuffer);

    scene.createEntity()
    .addComponent(VENTEA.MeshRenderer, new VENTEA.BoxMesh(Boid.bounds.x, 1, Boid.bounds.z)).position.set(Boid.bounds.x / 2, -0.5, Boid.bounds.z / 2);

    const tankMesh = new VENTEA.BoxMesh(Boid.bounds);
    const material = tankMesh.subMeshes[0].material!;
    const tank = scene.createEntity('Tank')
    .addComponent(VENTEA.MeshRenderer, tankMesh)
    .position.set(Boid.bounds.x / 2, Boid.bounds.y / 2, Boid.bounds.z / 2);
    const buffer = new VENTEA.UniformBuffer(28);
    buffer.data.fill(0);
    buffer.data[0] = 0.6;
    buffer.data[1] = 0.6;
    buffer.data[2] = 1;
    buffer.data[3] = 0.3;

    buffer.setData(0, buffer.data, 0, 7);

    material.set('pbr_material', buffer);
    material.build();

    window.addEventListener('resize', (e) => {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        camera.aspect = canvas.width / canvas.height;
        camera.updateProjection();

        VENTEA.Renderer.resize(window.innerWidth, window.innerHeight);
    });

    const gui = new GUI();
    gui.add(settings, 'useCompute');
    gui.add(settings, 'nbBoids', 0, MAX_BOIDS, 1).onChange((v: number) => {
        sceneData[3] = v;
        sceneBuffer.setData(0, sceneData);
        for(let i = 0; i < MAX_BOIDS; i++) {
            boids[i].entity.isVisible = i < v;
        }
    });
    gui.add(settings, 'viewRadius', 0, 20, 1).onFinishChange((v: number) => {
        sceneData[4] = v;
        sceneBuffer.setData(0, sceneData);
    });
    gui.add(settings, 'avoidRadius', 0, 20, 1).onFinishChange((v: number) => {
        sceneData[5] = v;
        sceneBuffer.setData(0, sceneData);
    });
    gui.add(Boid, 'speed', 0, 20, 1);
    gui.add(Boid, 'alignmentWeight', 0, 10, 0.1);
    gui.add(Boid, 'cohesionWeight', 0, 10, 0.1);
    gui.add(Boid, 'seperationWeight', 0, 10, 0.1);
    gui.add(Boid, 'wallWeight', 0, 10, 0.1);
    gui.add(settings, 'followPlayer').onChange((v: boolean) => {
        if(v) {
            Boid.target = camera.eye;
        } else {
            Boid.target = undefined;
        }
    });

    scene.createEntity().addComponent(VENTEA.Light, { r: 2, g: 2, b: 2, type: VENTEA.LightType.Directional }).position.set(1, 1, 1);
    scene.createEntity().addComponent(VENTEA.Light, { r: 2, g: 2, b: 2, type: VENTEA.LightType.Directional }).position.set(-1, 1, -1);

    const render = async (time: number) => {
        controls.update();

        if (settings.useCompute) {
            computeShader.dispatch(Math.ceil(settings.nbBoids / 100));
            await outputBuffer.getData().then(data => {
                // inputBoids.fill(0);
                for (let i = 0; i < settings.nbBoids; i++) {
                    const boid = boids[i];
                    inputBoids[i * 20 + 0] = boid.entity.position.x; // position.x
                    inputBoids[i * 20 + 1] = boid.entity.position.y; // position.y
                    inputBoids[i * 20 + 2] = boid.entity.position.z; // position.z
                    inputBoids[i * 20 + 4] = boid.direction.x; // direction.x
                    inputBoids[i * 20 + 5] = boid.direction.x; // direction.y
                    inputBoids[i * 20 + 6] = boid.direction.x; // direction.z
                }
                inputBuffer.setData(0, inputBoids);

                const view = new Float32Array(data);

                for (let i = 0; i < settings.nbBoids; i++) {
                    const x = view[i * 20 + 0];
                    const y = view[i * 20 + 1];
                    const z = view[i * 20 + 2];

                    let hx = view[i * 20 + 8];
                    let hy = view[i * 20 + 9];
                    let hz = view[i * 20 + 10];

                    let cx = view[i * 20 + 12];
                    let cy = view[i * 20 + 13];
                    let cz = view[i * 20 + 14];

                    let ax = view[i * 20 + 16];
                    let ay = view[i * 20 + 17];
                    let az = view[i * 20 + 18];

                    const flockmates = view[i * 20 + 19];

                    boids[i].flockHeading.set(hx, hy, hz);
                    boids[i].flockCenter.set(cx, cy, cz);
                    boids[i].avoidanceHeading.set(ax, ay, az);
                    boids[i].flockmates = flockmates;
                    boids[i].update();
                }
            });
        } else {
            for (let i = 0; i < settings.nbBoids; i++) {
                const src_boid = boids[i];
                for (let j = 0; j < settings.nbBoids; j++) {
                    if (i == j) {
                        continue;
                    }
                    const other_boid = boids[j];
                    const n = new VENTEA.Vector3().add(src_boid.entity.position).sub(other_boid.entity.position);
                    let distance = n.length();

                    if (distance < settings.viewRadius) {
                        src_boid.flockmates += 1.0;
                        src_boid.flockHeading.add(other_boid.direction);
                        src_boid.flockCenter.add(other_boid.entity.position);

                        if (distance < settings.avoidRadius) {
                            src_boid.avoidanceHeading.sub(n.mul(1 / (distance * distance)));
                        }
                    }
                }
            }

            for (let i = 0; i < settings.nbBoids; i++) {
                boids[i].update();
                boids[i].flockmates = 0;
                boids[i].flockHeading.reset();
                boids[i].flockCenter.reset();
                boids[i].avoidanceHeading.reset();
            }
        }

        VENTEA.Renderer.renderScene(scene, time, camera);
        requestAnimationFrame(render);
    }

    requestAnimationFrame(render);
})();