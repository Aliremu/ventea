import * as THREE from 'three';
import Stats from 'stats.js';
import { Vector3 } from 'three';

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
    camera.position.set(-5, 10, -5);
    camera.lookAt(new Vector3(50, 0, 50));

    scene.background = new THREE.Color(0x666666);

    const dirLight = new THREE.DirectionalLight();
    dirLight.position.set(5, 5, 5);
    dirLight.castShadow = true;
    dirLight.shadow.camera.zoom = 2;
    scene.add(dirLight);

    const pointLight = new THREE.PointLight(0xffffff, 0.8);
    camera.add(pointLight);
    scene.add(camera);

    const floor = new THREE.Mesh(
        new THREE.BoxGeometry(10, 5, 10),
        new THREE.ShadowMaterial({ color: 0x111111 })
    );
    floor.position.y = - 2.5;
    floor.receiveShadow = true;

    scene.add(floor);

    const material = new THREE.MeshPhongMaterial();

    const geometryBox = new THREE.BoxGeometry(1, 1, 1);

    const size = 150;
    const lol = 1;

    for (let i = 0; i < size * size; i++) {
        const box = new THREE.Mesh(geometryBox, material);
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

    const animate = () => {

        requestAnimationFrame(animate);

        scene.children.forEach(e => {
            if(e == camera) return;

            e.rotation.y += 0.05;
        });

        stats.begin()
        renderer.render(scene, camera);
        stats.end();
    }

    requestAnimationFrame(animate);
})();