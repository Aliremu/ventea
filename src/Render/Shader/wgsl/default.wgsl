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
           
struct Light {
    position: vec3<f32>,
    color: vec3<f32>,
    light: f32
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

fn get_translation_matrix(t: vec3<f32>) -> mat4x4<f32> {
    return mat4x4(
        1,
        0,
        0,
        0,
        0,
        1,
        0,
        0,
        0,
        0,
        1,
        0,
        t.x,
        t.y,
        t.z,
        1
    );
}

fn get_rotation_matrix(q: vec4<f32>) -> mat4x4<f32> {
    let x: f32 = q[0];
    let y: f32 = q[1];
    let z: f32 = q[2];
    let w: f32 = q[3];

    return mat4x4(
        1.0 - 2.0 * (y * y + z * z),
        2.0 * (x * y - z * w),
        2.0 * (x * z + y * w),
        0,
        2.0 * (x * y + z * w),
        1.0 - 2.0 * (x * x + z * z),
        2.0 * (y * z - x * w),
        0,
        2.0 * (x * z - y * w),
        2.0 * (y * z + x * w),
        1.0 - 2.0 * (x * x + y * y),
        0,
        0,
        0,
        0,
        1.0
    );
}

fn get_scale_matrix(s: vec3<f32>) -> mat4x4<f32> {
    return mat4x4(
        s.x,
        0,
        0,
        0,
        0,
        s.y,
        0,
        0,
        0,
        0,
        s.z,
        0,
        0,
        0,
        0,
        1
    );
}

@vertex
fn main(input: VSIn) -> VSOut {
    var vs_out: VSOut;

    //let trs: mat4x4<f32> = get_translation_matrix(vec3<f32>(0.0, 10.0, 0.0)) * get_rotation_matrix(vec4<f32>(0.0, 0.707, 0.0, 0.707))  * get_scale_matrix(vec3<f32>(2.0));

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

struct PBRMaterial {
    base_color: vec4<f32>,
    metallic_factor: f32,
    roughness_factor: f32,
    alpha: f32
};

struct Light {
    position: vec3<f32>,
    color: vec3<f32>,
    light: f32
};
            
@group(0) @binding(0)
var<uniform> uniforms: UBO;

@group(1) @binding(1)
var<storage> lights: array<Light>;

@group(2) @binding(0)
var<uniform> pbr_material: PBRMaterial;

@group(2) @binding(1)
var albedoTexture: texture_2d<f32>;
// var albedoTexture: texture_external;
@group(2) @binding(2)
var albedoSampler: sampler;
    
@group(2) @binding(3)
var normalTexture: texture_2d<f32>;
@group(2) @binding(4)
var normalSampler: sampler;

@group(2) @binding(5)
var ao_m_rTexture: texture_2d<f32>;
@group(2) @binding(6)
var ao_m_rSampler: sampler;

@group(2) @binding(7)
var occlusionTexture: texture_2d<f32>;
@group(2) @binding(8)
var occlusionSampler: sampler;

const PI: f32 = 3.14159265359;

fn perturb_normal(inFragPos: vec3<f32>, inNormal: vec3<f32>, texture: texture_2d<f32>, sample: sampler, uv: vec2<f32>) -> vec3<f32> {
    let tangent_normal: vec3<f32> = textureSample(texture, sample, uv).xyz * 2.0 - 1.0;

    let Q1: vec3<f32> = dpdxFine(inFragPos);
    let Q2: vec3<f32> = dpdyFine(inFragPos);
    let st1: vec2<f32> = dpdxFine(uv);
    let st2: vec2<f32> = dpdyFine(uv);

    let N: vec3<f32> = normalize(inNormal);
    let T: vec3<f32> = normalize(Q1 * st1.x + Q2 * st2.x);
    let B: vec3<f32> = -normalize(cross(N, T));
    let TBN: mat3x3<f32> = mat3x3(T, B, N);

    return normalize(TBN * tangent_normal);
}

fn distribution_ggx(N: vec3<f32>, H: vec3<f32>, roughness: f32) -> f32 {
    let a: f32 = roughness * roughness;
    let a2: f32 = a * a;
    let NdotH: f32 = max(dot(N, H), 0.0);
    let NdotH2: f32 = NdotH * NdotH;

    let nom: f32 = a2;
    var denom: f32 = (NdotH2 * (a2 - 1.0) + 1.0);
    denom = PI * denom * denom;

    return nom / denom;
}

fn geometry_schlick_ggx(NdotV: f32, roughness: f32) -> f32 {
    let r: f32 = (roughness + 1.0);
    let k: f32 = (r * r) / 8.0;

    let nom: f32 = NdotV;
    var denom: f32 = NdotV * (1.0 - k) + k;

    return nom / denom;
}
// ----------------------------------------------------------------------------
fn geometry_smith(N: vec3<f32>, V: vec3<f32>, L: vec3<f32>, roughness: f32) -> f32 {
    let NdotV: f32 = max(dot(N, V), 0.0);
    let NdotL: f32 = max(dot(N, L), 0.0);
    let ggx2: f32 = geometry_schlick_ggx(NdotV, roughness);
    let ggx1: f32 = geometry_schlick_ggx(NdotL, roughness);

    return ggx1 * ggx2;
}
// ----------------------------------------------------------------------------
fn fresnel_schlick(cosTheta: f32, F0: vec3<f32>) -> vec3<f32> {
    return F0 + (1.0 - F0) * pow(clamp(1.0 - cosTheta, 0.0, 1.0), 5.0);
}

struct BaseLight {
    color: vec3<f32>,
    ambient_intensity: f32,
    diffuse_intensity: f32
};

fn calculate_light_internal(base: BaseLight, view_dir: vec3<f32>, frag_pos: vec3<f32>, light_dir: vec3<f32>, albedo: vec3<f32>, normal: vec3<f32>, metallic: f32, roughness: f32, F0: vec3<f32>) -> vec3<f32> {
    let H: vec3<f32> = normalize(view_dir + light_dir);

    let radiance: vec3<f32> = base.color;

    let NDF: f32 = distribution_ggx(normal, H, roughness);
    let G: f32 = geometry_smith(normal, view_dir, light_dir, roughness);
    let F: vec3<f32> = fresnel_schlick(max(dot(H, view_dir), 0.0), F0);

    let numerator: vec3<f32> = NDF * G * F;
    let denominator: f32 = 4.0 * max(dot(normal, view_dir), 0.0) * max(dot(normal, light_dir), 0.0) + 0.0001; // + 0.0001 to prevent divide by zero
    let specular: vec3<f32> = numerator / denominator;

    let kS: vec3<f32> = F;
    var kD: vec3<f32> = vec3<f32>(1.0) - kS;

    kD *= 1.0 - metallic;	  

    // scale light by NdotL
    // let normal_dot_light_dir: f32 = ceil(max(dot(normal, light_dir), 0.0) / 0.3) * 0.3; //TODO: CEL SHADING      
    let normal_dot_light_dir: f32 = max(dot(normal, light_dir), 0.0); //TODO: CEL SHADING      

    // add to outgoing radiance Lo
    return (kD * albedo / PI + specular) * radiance * normal_dot_light_dir;
}

fn calculate_point_light(base: BaseLight, light_position: vec3<f32>, view_dir: vec3<f32>, frag_pos: vec3<f32>, albedo: vec3<f32>, normal: vec3<f32>, metallic: f32, roughness: f32, F0: vec3<f32>) -> vec3<f32> {
    let light_dir: vec3<f32> = normalize(light_position - frag_pos);
    let distance: f32 = length(light_position - frag_pos);

    var copy = base;
    copy.color /= (0.1 + (0.0001 * distance) + (0.0005 * distance * distance));

    let color: vec3<f32> = calculate_light_internal(copy, view_dir, frag_pos, light_dir, albedo, normal, metallic, roughness, F0);

    return color;
}

fn calculate_dir_light(base: BaseLight, view_dir: vec3<f32>, frag_pos: vec3<f32>, light_dir: vec3<f32>, albedo: vec3<f32>, normal: vec3<f32>, metallic: f32, roughness: f32, F0: vec3<f32>) -> vec3<f32> {
    let color: vec3<f32> = calculate_light_internal(base, view_dir, frag_pos, light_dir, albedo, normal, metallic, roughness, F0);

    return color;
}

fn calculate_spot_light(base: BaseLight, light_position: vec3<f32>, direction: vec3<f32>, cutoff: f32, view_dir: vec3<f32>, frag_pos: vec3<f32>, albedo: vec3<f32>, normal: vec3<f32>, metallic: f32, roughness: f32, F0: vec3<f32>) -> vec3<f32> {
    let light_dir: vec3<f32> = normalize(light_position - frag_pos);
    let spot_factor: f32 = dot(light_dir, direction);

    if spot_factor > cutoff {
        let color: vec3<f32> = calculate_light_internal(base, view_dir, frag_pos, light_dir, albedo, normal, metallic, roughness, F0);
        return color * (1.0 - (1.0 - spot_factor) * 1.0 / (1.0 - cutoff));
    } else {
        return vec3<f32>(0.0);
    }
}

fn aces(x: vec3<f32>) -> vec3<f32> {
    let a: f32 = 2.51;
    let b: f32 = 0.03;
    let c: f32 = 2.43;
    let d: f32 = 0.59;
    let e: f32 = 0.14;
    return clamp((x * (a * x + b)) / (x * (c * x + d) + e), vec3<f32>(0.0), vec3<f32>(1.0));
}

fn rgb2hsl(c: vec3<f32>) -> vec3<f32> {
    var h: f32 = 0.0;
    var s: f32 = 0.0;
    var l: f32 = 0.0;
    var r: f32 = c.r;
    var g: f32 = c.g;
    var b: f32 = c.b;
    var cMin: f32 = min(r, min(g, b));
    var cMax: f32 = max(r, max(g, b));

    l = (cMax + cMin) / 2.0;
    if cMax > cMin {
        let cDelta: f32 = cMax - cMin;
        
        //s = l < .05 ? cDelta / ( cMax + cMin ) : cDelta / ( 2.0 - ( cMax + cMin ) ); Original
        if l < 0.0 {
            s = cDelta / (cMax + cMin);
        } else {
            s = cDelta / (2.0 - (cMax + cMin));
        }

        if r == cMax {
            h = (g - b) / cDelta;
        } else if g == cMax {
            h = 2.0 + (b - r) / cDelta;
        } else {
            h = 4.0 + (r - g) / cDelta;
        }

        if h < 0.0 {
            h += 6.0;
        }
        h = h / 6.0;
    }

    return vec3<f32>(h, s, l);
}

fn hsl2rgb(c: vec3<f32>) -> vec3<f32> {
    let rgb: vec3<f32> = clamp(abs(((c.x * 6.0 + vec3<f32>(0.0, 4.0, 2.0)) % 6.0) - 3.0) - 1.0, vec3<f32>(0.0), vec3<f32>(1.0));

    return c.z + c.y * (rgb - 0.5) * (1.0 - abs(2.0 * c.z - 1.0));
}

@fragment
fn main(input: FSIn) -> @location(0) vec4<f32> {
    let sample: vec4<f32> = textureSample(albedoTexture, albedoSampler, input.tex_coord) * pbr_material.base_color;
    // let sample: vec4<f32> = textureSampleBaseClampToEdge(albedoTexture, albedoSampler, input.tex_coord) * pbr_material.base_color;
    // var hsl: vec3<f32> = rgb2hsl(sample.rgb);
    // hsl.b %= 0.2;
    // let albedo: vec3<f32> = hsl2rgb(hsl);
    let albedo: vec3<f32> = pow(sample.rgb, vec3<f32>(1.0));
    var alpha: f32 = sample.a;
    if alpha < 0.1 {
        // discard;
        //return;
    }

    var ao_m_r: vec3<f32> = vec3<f32>(0.0, 0.5, 0.0);

    let ao: f32 = textureSample(occlusionTexture, occlusionSampler, input.tex_coord).r; // ao_m_r.r;

    if textureDimensions(ao_m_rTexture).x > 1 {
        ao_m_r = textureSample(ao_m_rTexture, ao_m_rSampler, input.tex_coord).rgb;
    }

    let roughness: f32 = ao_m_r.g;
    let metallic: f32 = ao_m_r.b;

    let cringe: mat3x3<f32> = mat3x3(uniforms.view[0].xyz, uniforms.view[1].xyz, uniforms.view[2].xyz);
    let cam_pos: vec3<f32> = -uniforms.view[3].xyz * cringe;

    var normal: vec3<f32> = normalize(input.normal); 
    //let annoying = textureSample(normalTexture, normalSampler, input.tex_coord).rgb;
    if textureDimensions(normalTexture).x > 1 {
        normal = normalize(perturb_normal(input.frag_pos, input.normal, normalTexture, normalSampler, input.tex_coord));
    }

    let view_dir: vec3<f32> = normalize(cam_pos - input.frag_pos);

    var F0: vec3<f32> = vec3<f32>(0.04);
    F0 = mix(F0, albedo, metallic);

    var Lo: vec3<f32> = vec3<f32>(0.0);

    let light_positions: array<vec3<f32>, 4> = array(
        vec3<f32>(1.0, 2.0, 1.0),
        vec3<f32>(-1.0, 2.0, 1.0),
        vec3<f32>(-1.0, 2.0, -1.0),
        vec3<f32>(1.0, 2.0, -1.0)
    );

    let light_colors: array<vec3<f32>, 4> = array(
        0.2 * vec3<f32>(1.0, 0.8, 0.5),
        0.2 * vec3<f32>(1.0, 0.8, 0.5),
        0.2 * vec3<f32>(1.0, 0.8, 0.5),
        0.2 * vec3<f32>(1.0, 0.8, 0.5)
    );

    let len = arrayLength(&lights);

    let sun: BaseLight = BaseLight(1.0 * vec3<f32>(1.0, 0.9, 0.7), 1.0, 1.0);
    let moon: BaseLight = BaseLight(0.2 * vec3<f32>(0.3, 0.4, 0.8), 1.0, 1.0);

    // Lo = calculate_dir_light(sun, view_dir, input.frag_pos, normalize(vec3<f32>(0.0, -1.0, 0.0)), albedo, normal, metallic, roughness, F0);
    // Lo += calculate_dir_light(sun, view_dir, input.frag_pos, normalize(vec3<f32>(0.0, 1.0, 0.0)), albedo, normal, metallic, roughness, F0);

    //let scatter: BaseLight = BaseLight(3.0 * vec3<f32>(1.0, 0.9, 0.7), 1.0, 1.0);

    //Lo += calculate_dir_light(scatter, cam_pos, input.frag_pos, normalize(vec3<f32>(1.0, -1.0, 0.0)), albedo, normal, metallic, roughness, F0);
    var base2: BaseLight = BaseLight(20.0 * vec3<f32>(1.0, 0.8, 0.5), 1.0, 1.0);

    //for (var i: i32 = 0; i < 4; i = i + 1) {
    //    //Lo += max(dot(normal, normalize(light_positions[i] - input.frag_pos)), 0.0) * albedo;
    //    Lo += calculate_point_light(BaseLight(light_colors[i % 4], 1.0, 1.0), light_positions[i % 4], view_dir, input.frag_pos, albedo, normal, metallic, roughness, F0);
    //}

    for (var i: u32 = 0u; i < 3u; i = i + 1u) {
       //Lo += max(dot(normal, normalize(light_positions[i] - input.frag_pos)), 0.0) * albedo;
        let light = lights[i];
        let base = BaseLight(light.color, 1.0, 1.0);

        if light.light == 0.0 {
            Lo += calculate_point_light(base,light.position, view_dir, input.frag_pos, albedo, normal, metallic, roughness, F0);
        }

        if light.light == 1.0 {
            Lo += calculate_dir_light(base, view_dir, input.frag_pos, normalize(light.position), albedo, normal, metallic, roughness, F0);
        }

        if light.light == 2.0 {
            Lo += calculate_spot_light(base, light.position, vec3<f32>(0.0, 1.0, 0.0), 0.8, view_dir, input.frag_pos, albedo, normal, metallic, roughness, F0);
        }
    }

    let ambient: vec3<f32> = vec3<f32>(0.03) * albedo * ao; // Ambience. Default: 0.03
    var color: vec3<f32> = ambient + Lo;
    color = aces(color);
    //color = color / (color + vec3<f32>(1.0));
    //color = pow(color, vec3<f32>(1.0 / 2.2));

    //return vec4<f32>(vec3<f32>(ao), 1.0);
    // return vec4<f32>(dpdyCoarse(input.frag_pos), alpha);

    if length(input.frag_pos - cam_pos) < 1.5 {
        // float test = length(mod(v_TexCoord, 0.1) - round_test(mod(v_TexCoord, 0.1), 0.1));

        let scale: f32 = 0.1;
        var grid: vec3<f32> = vec3(0.0, 0.0, 0.0);
        let pos: vec3<f32> = input.frag_pos.xyz;

        grid.x = abs(pos.x) % scale;
        grid.y = abs(pos.y) % scale;
        grid.z = abs(pos.z) % scale;

        let zgrid: f32 = length(grid.xy - 0.5 * scale);
        let xgrid: f32 = length(grid.yz - 0.5 * scale);
        let ygrid: f32 = length(grid.xz - 0.5 * scale);

        let nyblend: f32 = abs(input.normal.y);
        let nzblend: f32 = abs(input.normal.z);

        let dotsize: f32 = 0.01;
        let result: f32 = step(mix(mix(xgrid, ygrid, nyblend), zgrid, nzblend), dotsize);

        if result > 0.0 {
            // color = mix(vec3<f32>(1.0), color, length(input.frag_pos - cam_pos) / 1.5);
            // alpha = 1.0;
        } else {
            // alpha = length(input.frag_pos - cam_pos) / 1.5;
        }
    }

    // return vec4<f32>(lights[0].position, 0.5);
    return vec4<f32>(color, alpha);
}