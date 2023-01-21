//Vertex
struct VSIn {
    @builtin(instance_index) instance_id: u32,
    @location(0) position: vec3<f32>,
    @location(1) normal: vec3<f32>,
    @location(2) tex_coord: vec2<f32>
};

struct VSOut {
    @builtin(position) Position: vec4<f32>,
    @location(0) frag_pos: vec3<f32>,
    @location(1) normal: vec3<f32>,
    @location(2) tex_coord: vec2<f32>
};
            
struct UBO {
    view: mat4x4<f32>,
    proj: mat4x4<f32>
};
              
@group(0) @binding(0)
var<uniform> uniforms: UBO;

@group(1) @binding(0)
var<storage> transform: array<mat4x4<f32>>;

fn inverse(m: mat4x4<f32>) -> mat4x4<f32> {
    let a00: f32 = m[0][0];
    let a01: f32 = m[0][1];
    let a02: f32 = m[0][2];
    let a03: f32 = m[0][3];
    let a10: f32 = m[1][0];
    let a11: f32 = m[1][1];
    let a12: f32 = m[1][2];
    let a13: f32 = m[1][3];
    let a20: f32 = m[2][0];
    let a21: f32 = m[2][1];
    let a22: f32 = m[2][2];
    let a23: f32 = m[2][3];
    let a30: f32 = m[3][0];
    let a31: f32 = m[3][1];
    let a32: f32 = m[3][2];
    let a33: f32 = m[3][3];

    let b00: f32 = a00 * a11 - a01 * a10;
    let b01: f32 = a00 * a12 - a02 * a10;
    let b02: f32 = a00 * a13 - a03 * a10;
    let b03: f32 = a01 * a12 - a02 * a11;
    let b04: f32 = a01 * a13 - a03 * a11;
    let b05: f32 = a02 * a13 - a03 * a12;
    let b06: f32 = a20 * a31 - a21 * a30;
    let b07: f32 = a20 * a32 - a22 * a30;
    let b08: f32 = a20 * a33 - a23 * a30;
    let b09: f32 = a21 * a32 - a22 * a31;
    let b10: f32 = a21 * a33 - a23 * a31;
    let b11: f32 = a22 * a33 - a23 * a32;

    let det: f32 = b00 * b11 - b01 * b10 + b02 * b09 + b03 * b08 - b04 * b07 + b05 * b06;

    return mat4x4(
        (a11 * b11 - a12 * b10 + a13 * b09) / det,
        (a02 * b10 - a01 * b11 - a03 * b09) / det,
        (a31 * b05 - a32 * b04 + a33 * b03) / det,
        (a22 * b04 - a21 * b05 - a23 * b03) / det,
        (a12 * b08 - a10 * b11 - a13 * b07) / det,
        (a00 * b11 - a02 * b08 + a03 * b07) / det,
        (a32 * b02 - a30 * b05 - a33 * b01) / det,
        (a20 * b05 - a22 * b02 + a23 * b01) / det,
        (a10 * b10 - a11 * b08 + a13 * b06) / det,
        (a01 * b08 - a00 * b10 - a03 * b06) / det,
        (a30 * b04 - a31 * b02 + a33 * b00) / det,
        (a21 * b02 - a20 * b04 - a23 * b00) / det,
        (a11 * b07 - a10 * b09 - a12 * b06) / det,
        (a00 * b09 - a01 * b07 + a02 * b06) / det,
        (a31 * b01 - a30 * b03 - a32 * b00) / det,
        (a20 * b03 - a21 * b01 + a22 * b00) / det
    );
}

@vertex
fn main(input: VSIn) -> VSOut {
    var vs_out: VSOut;

    let world_pos: vec4<f32> = transform[input.instance_id] * vec4<f32>(input.position, 1.0);

    vs_out.Position = uniforms.proj * uniforms.view * world_pos;
    vs_out.frag_pos = (world_pos).xyz;
    let cum: mat4x4<f32> = transpose(inverse(transform[input.instance_id]));
    let cringe: mat3x3<f32> = mat3x3(cum[0].xyz, cum[1].xyz, cum[2].xyz);
    vs_out.normal = cringe * input.normal;
    vs_out.tex_coord = input.tex_coord;

    return vs_out;
}

//Fragment
struct UBO {
    view: mat4x4<f32>,
    proj: mat4x4<f32>
};

struct FSIn {
    @location(0) frag_pos: vec3<f32>,
    @location(1) normal: vec3<f32>,
    @location(2) tex_coord: vec2<f32>
};
            
@group(0) @binding(0)
var<uniform> uniforms: UBO;

@group(2) @binding(1)
var depthTexture: texture_2d<f32>;

@group(2) @binding(2)
var depthSampler: sampler;

@fragment
fn main(input: FSIn) -> @location(0) vec4<f32> {
    let sample: vec4<f32> = textureSample(depthTexture, depthSampler, input.tex_coord);

    if(sample.a < 0.5) {
        discard;
    }

    return sample;
}