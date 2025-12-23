import * as THREE from 'three';
import Stats from 'stats.js';
import { MeshBasicMaterial, Vector3 } from 'three';

// const canvas = document.createElement('canvas');
// canvas.width = window.innerWidth;
// canvas.height = window.innerHeight;

// document.body.appendChild(canvas);

// canvas.onclick = () => {
//     canvas.requestPointerLock();
// };

(async () => {
    const scene = new THREE.Scene();

    const camera = new THREE.PerspectiveCamera(90, window.innerWidth / window.innerHeight, 0.1, 100);
    const size = 150;
    
    camera.position.set(size/2, 100, size/2);
    camera.lookAt(new Vector3(size/2, 0, size/2));

    scene.background = new THREE.Color(0x666666);

    const dirLight = new THREE.DirectionalLight();
    dirLight.position.set(5, 5, 5);
    dirLight.castShadow = true;
    dirLight.shadow.camera.zoom = 2;
    scene.add(dirLight);

    const pointLight = new THREE.PointLight(0xffffff, 0.8);
    camera.add(pointLight);
    scene.add(camera);

    // const material = new THREE.MeshPhysicalMaterial();
    // material.color = new THREE.Color(100);
    const geometryBox = new THREE.BoxGeometry(1, 1, 1);
    const lol = 1;

    for (let i = 0; i < size * size; i++) {
        const box = new THREE.Mesh(geometryBox);
        box.receiveShadow = true;
        box.position.set(~~(i / size) * lol, 0, (i % size) * lol);
        scene.add(box);
    }

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = false;
    renderer.outputEncoding = THREE.sRGBEncoding;
    document.body.appendChild(renderer.domElement);

    window.addEventListener("resize", onWindowResize);

    function onWindowResize() {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();

        renderer.setSize(window.innerWidth, window.innerHeight);
    }

    const stats = new Stats();
    stats.showPanel(1); // 0: fps, 1: ms, 2: mb, 3+: custom
    document.body.appendChild(stats.dom);

    const mat = scene.children[3] as THREE.Mesh;

    let lastTime = 0;
    let times: number[] = [];

    const avg = (arr: number[]) => {
        return arr.reduce((l, r) => l + r) / arr.length;
    }

    const animate = (time: number) => {
        // if(lastTime == 0) {
        //     lastTime = time;
        // } else {
        //     const diff = time - lastTime;
        //     times.push(diff);
        //     lastTime = time;
        // }

        requestAnimationFrame(animate);

        // (mat.material as MeshBasicMaterial).color.multiplyScalar(0.99);

        scene.children.forEach(e => {
            if(e == camera) return;

            // if(e instanceof THREE.Mesh) {
            //     (e.material as MeshBasicMaterial).color.multiplyScalar(0.99);
            // }
            e.rotation.y += 0.05;
        });


        // material.color.multiplyScalar(0.99);

        stats.begin()
        renderer.render(scene, camera);
        stats.end();

        // if(times.length > 100) {
        //     console.log(avg(times));
        // }
    }

    requestAnimationFrame(animate);
})();