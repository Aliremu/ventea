struct Ball {
    radius: f32,
    id: f32,
    position: vec2<f32>,
    velocity: vec2<f32>,
}

@group(0) @binding(0)
var<storage, read> input: array<Ball>;

@group(0) @binding(1)
var<storage, read_write> output: array<Ball>;

struct Scene {
    width: f32,
    height: f32,
}

@group(0) @binding(2)
var<storage, read> scene: Scene;

const PI: f32 = 3.14159;
const TIME_STEP: f32 = 0.016;

@compute @workgroup_size(100)
fn main(
    @builtin(global_invocation_id) global_id: vec3<u32>,
) {
    let num_balls = arrayLength(&output);
    if global_id.x >= num_balls {
        return;
    }
    var src_ball = input[global_id.x];
    let dst_ball = &output[global_id.x];

    (*dst_ball) = src_ball;

      // Ball/Ball collision
    for (var i = 0u; i < num_balls; i = i + 1u) {
        if i == global_id.x {
          continue;
        }
        var other_ball = input[i];
        let n = src_ball.position - other_ball.position;
        let distance = length(n);
        if distance >= src_ball.radius + other_ball.radius {
          continue;
        }
        let overlap = src_ball.radius + other_ball.radius - distance;
        (*dst_ball).position = src_ball.position + normalize(n) * overlap / 2.;

        // Details on the physics here:
        // https://physics.stackexchange.com/questions/599278/how-can-i-calculate-the-final-velocities-of-two-spheres-after-an-elastic-collisi
        let src_mass = pow(src_ball.radius, 2.0) * PI;
        let other_mass = pow(other_ball.radius, 2.0) * PI;
        let c = 2. * dot(n, (other_ball.velocity - src_ball.velocity)) / (dot(n, n) * (1. / src_mass + 1. / other_mass));
        (*dst_ball).velocity = src_ball.velocity + c / src_mass * n;
    }

      // Apply velocity
    (*dst_ball).position = (*dst_ball).position + (*dst_ball).velocity * TIME_STEP;

      // Ball/Wall collision
    if (*dst_ball).position.x - (*dst_ball).radius < 0. {
        (*dst_ball).position.x = (*dst_ball).radius;
        (*dst_ball).velocity.x = -(*dst_ball).velocity.x;
    }
    if (*dst_ball).position.y - (*dst_ball).radius < 0. {
        (*dst_ball).position.y = (*dst_ball).radius;
        (*dst_ball).velocity.y = -(*dst_ball).velocity.y;
    }
    if (*dst_ball).position.x + (*dst_ball).radius >= scene.width {
        (*dst_ball).position.x = scene.width - (*dst_ball).radius;
        (*dst_ball).velocity.x = -(*dst_ball).velocity.x;
    }
    if (*dst_ball).position.y + (*dst_ball).radius >= scene.height {
        (*dst_ball).position.y = scene.height - (*dst_ball).radius;
        (*dst_ball).velocity.y = -(*dst_ball).velocity.y;
    }
}