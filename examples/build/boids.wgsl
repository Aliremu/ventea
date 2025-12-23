struct Boid {
    position: vec3<f32>,
    direction: vec3<f32>,

    flockHeading: vec3<f32>,
    flockCenter: vec3<f32>,
    avoidanceHeading: vec3<f32>,
    nbFlockmates: f32
}

struct Scene {
    nbBoids: f32,
    viewRadius: f32,
    avoidRadius: f32
}

@group(0) @binding(0)
var<storage, read> input: array<Boid>;

@group(0) @binding(1)
var<storage, read_write> output: array<Boid>;

@group(0) @binding(2)
var<storage, read> scene: Scene;

// const PI: f32 = 3.14159;
// const TIME_STEP: f32 = 0.016;

@compute @workgroup_size(100)
fn main(
    @builtin(global_invocation_id) global_id: vec3<u32>,
) {
    let num_boids = arrayLength(&output);
    if global_id.x >= num_boids {
        return;
    }
    var src_boid = input[global_id.x];
    let dst_boid = &output[global_id.x];

    (*dst_boid) = src_boid;

    for (var i = 0u; i < num_boids; i = i + 1u) {
        if i == global_id.x {
          continue;
        }
        var other_boid = input[i];
        let n = src_boid.position - other_boid.position;
        let distance = length(n);
        
        if(distance < scene.viewRadius) {
            (*dst_boid).nbFlockmates += 1.0;
            (*dst_boid).flockHeading += other_boid.direction;
            (*dst_boid).flockCenter += other_boid.position;

            if(distance < scene.avoidRadius) {
                (*dst_boid).avoidanceHeading -= n / (distance * distance);
            }
        }
    }

    // let new_position = (src_boid.position + src_boid.direction + scene.dimensions) % scene.dimensions;

    // (*dst_boid).position = new_position;
}