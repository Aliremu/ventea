[![npm version](https://badge.fury.io/js/ventea.svg)](https://badge.fury.io/js/ventea)
[![minzipped size](https://badgen.net/bundlephobia/minzip/ventea)](https://bundlephobia.com/result?p=ventea)
[![code style: prettier](https://img.shields.io/badge/code_style-prettier-ff69b4.svg?style=flat-square)](https://github.com/prettier/prettier)

# ventea

An ECS based game engine built in TypeScript with WebGL and WebGPU support and NVidia PhysX integration.  

## Table of contents

- [ventea](#ventea)
  - [Table of contents](#table-of-contents)
  - [Getting Started](#getting-started)
  - [Installation](#installation)
  - [Usage](#usage)
    - [Building a distribution version](#building-a-distribution-version)
    - [Running the examples](#running-the-examples)
  <!-- - [API](#api)
    - [useBasicFetch](#usebasicfetch)
      - [Options](#options)
    - [fetchData](#fetchdata) -->

## Getting Started

These instructions will get you a copy of the project up and running on your local machine for development and testing purposes. Examples can be found in the examples directory and a demo website will be created soon.

## Installation

Start with cloning this repo on your local machine:

```sh
$ git clone https://github.com/Aliremu/ventea.git
$ cd ventea
```

To install and set up the library, run:

```sh
$ npm install ventea
```

## Usage

```javascript

import * as VENTEA from 'ventea';

const canvas = document.createElement('canvas');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

document.body.appendChild(canvas);

canvas.onclick = () => {
    canvas.requestPointerLock();
};

(async () => {
    // Initializes the engine with WebGL and physics disabled
    const engine = new VENTEA.Engine(canvas);
    await engine.init({
        api: VENTEA.API.WebGL,
        physics: false
    });

    // Creates perspective camera and first person controls
    const camera = new VENTEA.PerspectiveCamera(90, canvas.width / canvas.height, 0.01, 1000.0);

    const controls = new VENTEA.FirstPersonControls(camera);
    controls.update();

    const scene = new VENTEA.Scene();

    // Creates a directional light and sets the color and direction
    const light = scene.createEntity('Light');
    light.addComponent(VENTEA.Light, { r: 2, g: 1.8, b: 1.4, type: VENTEA.LightType.Directional });
    light.position.set(1, 1, 1);

    const grid = scene.createEntity('Grid');
    grid.addComponent(VENTEA.MeshRenderer, new VENTEA.GridMesh(100, 100));

    const box = scene.createEntity('Box');
    box.addComponent(VENTEA.MeshRenderer, new VENTEA.BoxMesh(2, 2, 2));
    box.position.set(0, 1, 0);
    
    // Resizes the canvas on window resize
    window.addEventListener('resize', (e) => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;

      camera.aspect = canvas.width / canvas.height;
      camera.updateProjection();

      VENTEA.Renderer.resize(window.innerWidth, window.innerHeight);
    });

    const render = (time: number) => {
        controls.update();

        // Rotates the box by 0.01 radians every frame on the y-axis
        box.rotation.y += 0.01;

        // Renders the scene
        VENTEA.Renderer.renderScene(scene, time, camera);

        requestAnimationFrame(render);
    }

    requestAnimationFrame(render);
})();
```

### Building a distribution version

```sh
$ npm run build
```

This task will create a distribution version of the project
inside your local `dist/` folder

### Running the examples

```sh
$ cd examples
$ npm run dev
```

<!-- ## API

### useBasicFetch

```js
useBasicFetch(url: string = '', delay: number = 0)
```

Supported options and result fields for the `useBasicFetch` hook are listed below.

#### Options

`url`

| Type | Default value |
| --- | --- |
| string | '' |

If present, the request will be performed as soon as the component is mounted

Example:

```tsx
const MyComponent: React.FC = () => {
  const { data, error, loading } = useBasicFetch('https://api.icndb.com/jokes/random');

  if (error) {
    return <p>Error</p>;
  }

  if (loading) {
    return <p>Loading...</p>;
  }

  return (
    <div className="App">
      <h2>Chuck Norris Joke of the day</h2>
      {data && data.value && <p>{data.value.joke}</p>}
    </div>
  );
};
```

`delay`

| Type | Default value | Description |
| --- | --- | --- |
| number | 0 | Time in milliseconds |

If present, the request will be delayed by the given amount of time

Example:

```tsx
type Joke = {
  value: {
    id: number;
    joke: string;
  };
};

const MyComponent: React.FC = () => {
  const { data, error, loading } = useBasicFetch<Joke>('https://api.icndb.com/jokes/random', 2000);

  if (error) {
    return <p>Error</p>;
  }

  if (loading) {
    return <p>Loading...</p>;
  }

  return (
    <div className="App">
      <h2>Chuck Norris Joke of the day</h2>
      {data && data.value && <p>{data.value.joke}</p>}
    </div>
  );
};
```

### fetchData

```js
fetchData(url: string)
```

Perform an asynchronous http request against a given url

```tsx
type Joke = {
  value: {
    id: number;
    joke: string;
  };
};

const ChuckNorrisJokes: React.FC = () => {
  const { data, fetchData, error, loading } = useBasicFetch<Joke>();
  const [jokeId, setJokeId] = useState(1);

  useEffect(() => {
    fetchData(`https://api.icndb.com/jokes/${jokeId}`);
  }, [jokeId, fetchData]);

  const handleNext = () => setJokeId(jokeId + 1);

  if (error) {
    return <p>Error</p>;
  }

  const jokeData = data && data.value;

  return (
    <div className="Comments">
      {loading && <p>Loading...</p>}
      {!loading && jokeData && (
        <div>
          <p>Joke ID: {jokeData.id}</p>
          <p>{jokeData.joke}</p>
        </div>
      )}
      {!loading && jokeData && !jokeData.joke && <p>{jokeData}</p>}
      <button disabled={loading} onClick={handleNext}>
        Next Joke
      </button>
    </div>
  );
};
``` -->

## License

[MIT License](https://andreasonny.mit-license.org/2019) © Andrea SonnY