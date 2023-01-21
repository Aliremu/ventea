import PhysX from "physx-js-webidl";
import { Vector3 } from "../Math/Vector";
// // @ts-ignore
// import Wasm from "../../node_modules/physx-js-webidl/physx-js-webidl.wasm";


// importScripts("https://raw.githubusercontent.com/fabmax/physx-js-webidl/main/dist/physx-js-webidl.js");
// @ts-ignore
// importScripts('https://cdn.skypack.dev/physx-js-webidl');
// importScripts('https://cdn.jsdelivr.net/npm/physx-js-webidl@2.0.4/physx-js-webidl.js');

onmessage = (m) => {
    Object.setPrototypeOf(m.data.o.pos, Vector3.prototype);
    console.log("MESSAGE", m.data.o.pos);
}

postMessage({ m: "ready" });

PhysX().then(val => {
    console.log(val);
});

// export default null as any;