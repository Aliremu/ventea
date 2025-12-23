// import { GLTF, GLTFMaterial, GLTFScene } from '@loaders.gl/gltf';


// enum Type {
//     FLOAT,
//     UINT,
//     IMAGE
// };
// /*
// const getAccessor = (asset: GltfAsset, attribute: number, dataType: Type) => {
//     const accessor = asset.gltf.accessors![attribute];
//     const bufferView = asset.gltf.bufferViews![accessor.bufferView!];
//     const componentType = accessor.componentType;
//     const count = accessor.count;
//     const type = accessor.type;

//     const chunk = asset.glbData!.binaryChunk;
//     const buffer = chunk.buffer;

//     const start = (accessor.byteOffset ?? 0) + chunk.byteOffset + (bufferView.byteOffset ?? 0);
//     // const length = bufferView.byteLength;
//     const length = accessor.count;

//     console.log(start, length);

//     switch (dataType) {
//         case Type.FLOAT:
//             return new Float32Array(buffer, start, bufferView.byteLength / Float32Array.BYTES_PER_ELEMENT);
//         case Type.UINT:
//             if (componentType == 5125) {
//                 console.log('CUM1trytyr', length);
//                 return new Uint32Array(buffer, start, length);// / Uint32Array.BYTES_PER_ELEMENT); 
//             } else {
//                 console.log('SPEED BUNDA');
//                 return Uint32Array.from(new Uint16Array(buffer, start, bufferView.byteLength / Uint16Array.BYTES_PER_ELEMENT));
//             }
//         case Type.IMAGE:
//             return new Uint8Array(buffer, start, length).slice();
//     }
// }*/


// export class GLTFMesh extends Mesh {
//     constructor(gltf: GLTF) {
        

//         //console.log(positions);
//         //console.log(indices);

//         super(positions, normals, texCoords, indices);
//         this.subMeshes = subMeshes;

//         for (const subMesh of subMeshes) {
//             // subMesh.material!.bindGroup = WebGPUContext.device.createBindGroup({
//             //     layout: this.pipeline.as<WebGPUPipieline>().pipeline.getBindGroupLayout(2),
//             //     entries: subMesh.material!.descriptor
//             // });

//             subMesh.material!.pipeline = this.pipeline;
//             subMesh.material!.build();
//         }
//     }
// }