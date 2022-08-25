import * as VENTEA from "./Ventea.js";
import '../lib/gltf-loader/gltf-loader.js';

const { GltfLoader } = window.GltfLoader;

const loader = new GltfLoader();

export class Resource {
    id = 0;
    type = 0;
    response = [];

    static CACHE = [];

    constructor(type, response, id) {
        if(typeof id === 'undefined') {
            this.id = Resource.CACHE.length;
            Resource.CACHE.push(this);
        }
        this.type = type;
        this.response = response;
    }

    static async init() {
    }

    static async $loadImage(uri) {
        const promises = uri.map(url => {
            let img = new Image();
            img.src = url;
            return new Promise((resolve, reject) => {
                let img = new Image();
                img.onload = () => resolve(new Resource(VENTEA.IMAGE, img));
                img.onerror = reject;
                img.src = url;
            })
        });

        return Promise.all(promises);
    }

    static async $loadModel(uri) {
        return new Promise((resolve, reject) => {
            loader.load(uri, (progress) => {
                console.log(progress.loaded / progress.total);
            }).then(asset => {
                //resolve(new Resource(VENTEA.GLTF, { asset: asset, data: [] }));
                console.log(asset);
                asset.imageData.preFetchAll().then(data => {
                    resolve(new Resource(VENTEA.GLTF, { asset: asset, images: data }));
                });
            });
        });
    }

    static async $loadText(uri) {
        return new Promise((resolve, reject) => {
            fetch(uri).then(res => resolve(new Resource(VENTEA.TEXT, res)));
        });
    }

    static async $loadAudio(uri) {
        return fetch(uri, { 'mode': 'no-cors' })
            .then(response => response.arrayBuffer())
            .then(arrayBuffer => {
                return new Resource(VENTEA.AUDIO, arrayBuffer);
            });
    }

    static async load(type, uri) {
        let resource = null;
        switch (type) {
            case VENTEA.IMAGE: resource = Resource.$loadImage(uri); break;
            case VENTEA.GLTF: resource = Resource.$loadModel(uri); break;
            case VENTEA.TEXT: resource = Resource.$loadText(uri); break;
            case VENTEA.AUDIO: resource = Resource.$loadAudio(uri); break;
        }

        const id = Resource.CACHE.length;
        return resource;
    }
}