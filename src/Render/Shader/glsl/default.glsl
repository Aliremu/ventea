//Vertex#version 300 es
precision highp float;

layout(location = 0) in vec3 position;
layout(location = 1) in vec3 normal;
layout(location = 2) in vec2 tex_coord;
// layout(location = 3) in mat4 transform;

out vec3 v_FragPos;
out vec3 v_Normal;
out vec2 v_TexCoord;

uniform mat4 view;
uniform mat4 proj;
uniform mat4 model;

uniform int offset;

uniform sampler2D transformTexture;

void main() {
    int pid = 4 * offset + 4 * gl_InstanceID;
    int w = 512;
    int h = 512;
    ivec2 p1 = ivec2((pid + 0) % w, (pid + 0) / w);
    ivec2 p2 = ivec2((pid + 1) % w, (pid + 1) / w);
    ivec2 p3 = ivec2((pid + 2) % w, (pid + 2) / w);
    ivec2 p4 = ivec2((pid + 3) % w, (pid + 3) / w);

    mat4 transform = mat4(
        texelFetch(transformTexture, p1, 0),
        texelFetch(transformTexture, p2, 0),
        texelFetch(transformTexture, p3, 0),
        texelFetch(transformTexture, p4, 0)
    );

    // mat4 transform = mat4(vec4(1,0,0,0), vec4(0,1,0,0), vec4(0,0,1,0), vec4(0,0,0,1));

    vec4 local = transform * vec4(position, 1.0);

    v_FragPos = vec3(local);
    v_Normal = mat3(transpose(inverse(transform))) * normal;
    v_TexCoord = tex_coord;

    vec4 pos = proj * view * local;
    gl_Position = pos;
}

//Fragment#version 300 es
precision highp float;

in vec3 v_FragPos;
in vec3 v_Normal;
in vec2 v_TexCoord;

layout(location = 0) out vec4 color;

uniform mat4 view;
uniform mat4 proj;
uniform mat4 model;

#define MAX_LIGHTS 16

struct BaseLight {
  vec3 position;
  vec3 color;
  float type;
};

uniform BaseLight lights[MAX_LIGHTS];
uniform int num_lights;

layout(std140) uniform pbr_material {
	vec4 base_color;
    float metalness_factor;
    float roughness_factor;
    float alpha;
};

uniform sampler2D albedoTexture;
uniform sampler2D normalTexture;
uniform sampler2D ao_m_rTexture;
uniform sampler2D occlusionTexture;

uniform sampler2D skyboxTexture;
uniform sampler2D specularBRDF;

const float PI = 3.14159265359;

mat3 cotangent_frame(vec3 N, vec3 p, vec2 uv) {
    // get edge vectors of the pixel triangle
    vec3 dp1 = dFdx(p);
    vec3 dp2 = dFdy(p);
    vec2 duv1 = dFdx(uv);
    vec2 duv2 = dFdy(uv);

    // solve the linear system
    vec3 dp2perp = cross(dp2, N);
    vec3 dp1perp = cross(N, dp1);
    vec3 T = dp2perp * duv1.x + dp1perp * duv2.x;
    vec3 B = dp2perp * duv1.y + dp1perp * duv2.y;

    // construct a scale-invariant frame 
    float invmax = inversesqrt(max(dot(T, T), dot(B, B)));
    return mat3(T * invmax, B * invmax, N);
}

vec3 perturb_normal(vec3 V, vec3 N, sampler2D tex, vec2 texcoord) {
    vec3 map = texture(tex, texcoord).rgb;
    map = map * 2.0 - 1.0;
    mat3 TBN = cotangent_frame(N, -V, texcoord);
    return normalize(TBN * map);
}

vec3 PerturbNormal(vec3 FragPos, vec3 Normal, sampler2D Texture, vec2 TexCoord) {
    vec3 tangent_normal = texture(Texture, TexCoord).xyz * 2.0 - 1.0;

    vec3 Q1 = dFdx(FragPos);
    vec3 Q2 = dFdy(FragPos);
    vec2 st1 = dFdx(TexCoord);
    vec2 st2 = dFdy(TexCoord);

    vec3 N = normalize(Normal);
    vec3 T = normalize(Q1 * st1.x + Q2 * st2.x);
    vec3 B = -normalize(cross(N, T));
    mat3 TBN = mat3(T, B, N);

    return normalize(TBN * tangent_normal);
}

float distribution_ggx(vec3 N, vec3 H, float roughness) {
    float a = roughness * roughness;
    float a2 = a * a;
    float NdotH = max(dot(N, H), 0.0);
    float NdotH2 = NdotH * NdotH;

    float nom = a2;
    float denom = (NdotH2 * (a2 - 1.0) + 1.0);
    denom = PI * denom * denom;

    return nom / denom;
}

float geometry_schlick_ggx(float NdotV, float roughness) {
    float r = (roughness + 1.0);
    float k = (r * r) / 8.0;

    float nom = NdotV;
    float denom = NdotV * (1.0 - k) + k;

    return nom / denom;
}

vec3 fresnel_schlick_roughness(float cosTheta, vec3 F0, float roughness) {
    return F0 + (max(vec3(1.0 - roughness), F0) - F0) * pow(clamp(1.0 - cosTheta, 0.0, 1.0), 5.0);
}   

// ----------------------------------------------------------------------------
float geometry_smith(vec3 N, vec3 V, vec3 L, float roughness) {
    float NdotV = max(dot(N, V), 0.0);
    float NdotL = max(dot(N, L), 0.0);
    float ggx2 = geometry_schlick_ggx(NdotV, roughness);
    float ggx1 = geometry_schlick_ggx(NdotL, roughness);

    return ggx1 * ggx2;
}
// ----------------------------------------------------------------------------
vec3 fresnel_schlick(float cosTheta, vec3 F0){
    return F0 + (1.0 - F0) * pow(clamp(1.0 - cosTheta, 0.0, 1.0), 5.0);
}

vec3 calculate_light_internal(BaseLight base, vec3 view_dir, vec3 frag_pos, vec3 light_dir, vec3 albedo, vec3 normal, float metallic, float roughness, vec3 F0) {
    vec3 H = normalize(view_dir + light_dir);

    vec3 radiance = base.color;

    float NDF = distribution_ggx(normal, H, roughness);
    float G = geometry_smith(normal, view_dir, light_dir, roughness);
    vec3 F = fresnel_schlick(max(dot(H, view_dir), 0.0), F0);

    vec3 numerator = NDF * G * F;
    float denominator = 4.0 * max(dot(normal, view_dir), 0.0) * max(dot(normal, light_dir), 0.0) + 0.0001; // + 0.0001 to prevent divide by zero
    vec3 specular = numerator / denominator;

    vec3 kS = F;
    vec3 kD = vec3(1.0) - kS;

    kD *= 1.0 - metallic;	  

    // scale light by NdotL
    // let normal_dot_light_dir: f32 = ceil(max(dot(normal, light_dir), 0.0) / 0.3) * 0.3; //TODO: CEL SHADING      
    float normal_dot_light_dir = max(dot(normal, light_dir), 0.0); //TODO: CEL SHADING      

    // add to outgoing radiance Lo
    return (kD * albedo / PI + specular) * radiance * normal_dot_light_dir;
}

vec3 calculate_point_light(BaseLight base, vec3 light_position, vec3 view_dir, vec3 frag_pos, vec3 albedo, vec3 normal, float metallic, float roughness, vec3 F0) {
    vec3 light_dir = normalize(light_position - frag_pos);
    float distance = length(light_position - frag_pos);

    BaseLight copy = base;
    copy.color /= (0.1 + (0.0001 * distance) + (0.0005 * distance * distance));

    vec3 color = calculate_light_internal(copy, view_dir, frag_pos, light_dir, albedo, normal, metallic, roughness, F0);

    return color;
}

vec3 calculate_dir_light(BaseLight base, vec3 view_dir, vec3 frag_pos, vec3 light_dir, vec3 albedo, vec3 normal, float metallic, float roughness, vec3 F0) {
    vec3 color = calculate_light_internal(base, view_dir, frag_pos, light_dir, albedo, normal, metallic, roughness, F0);

    return color;
}

vec3 aces(vec3 x) {
    float a = 2.51;
    float b = 0.03;
    float c = 2.43;
    float d = 0.59;
    float e = 0.14;
    return clamp((x * (a * x + b)) / (x * (c * x + d) + e), vec3(0.0), vec3(1.0));
}

const vec2 invAtan = vec2(0.1591, 0.3183);
vec2 SampleSphericalMap(vec3 v)
{
    vec2 uv = vec2(atan(v.z, v.x), asin(v.y));
    uv *= invAtan;
    uv += 0.5;
    return uv;
}

void main() {
    vec4 sampled = texture(albedoTexture, v_TexCoord);
    vec3 albedo = sampled.rgb * base_color.rgb;
    float alpha = sampled.a * base_color.a;

    if(alpha < 0.5) {
        discard;
    }

    vec3 ao_m_r = vec3(0.0, roughness_factor, metalness_factor);

    // float ao = texture(occlusionTexture, v_TexCoord).r; // ao_m_r.r;
    float ao = ao_m_r.r;

    if(textureSize(ao_m_rTexture, 0).x > 1) {
        ao_m_r = texture(ao_m_rTexture, v_TexCoord).rgb;
    }

    float roughness = ao_m_r.g;
    float metalness = ao_m_r.b;

    vec3 normal = normalize(v_Normal); 
    if(textureSize(normalTexture, 0).x > 1) {
        normal = normalize(perturb_normal(v_FragPos, normal, normalTexture, v_TexCoord)); // perturb_normal(Normal, Eye, v_TexCoord);
    }

    vec3 Fdielectric = vec3(0.04);
    vec3 F0 = mix(Fdielectric, albedo, metalness);

    vec3 Lo = vec3(0.0);

    vec3 cam_pos = -view[3].xyz * mat3(view);
    vec3 view_dir = normalize(cam_pos - v_FragPos);

    float cosLo = max(dot(normal, view_dir), 0.0);

    for(int i = 0; i < MAX_LIGHTS; i++) {
        if(i >= num_lights) {
            break;
        }

        BaseLight light = lights[i];
        // vec3 lightDir = normalize(light.position - v_FragPos);

        // if(light.type == 1.0) {
        //     lightDir = normalize(light.position);
        // }

        if(light.type == 0.0) {
            Lo += calculate_point_light(light, light.position, view_dir, v_FragPos, albedo, normal, metalness, roughness, F0);
        }

        if(light.type == 1.0) {
            Lo += calculate_dir_light(light, view_dir, v_FragPos, normalize(light.position), albedo, normal, metalness, roughness, F0);
        }
    }

    float PI = 3.1415926535897932384626433832795;
    vec3 R = reflect(view_dir, normalize(normal));
    R = normalize(R);

    // float v = acos(R.y) / PI;
    // float u = (atan(R.z, -R.x) + PI) / (2.0 * PI);

    vec2 uv = SampleSphericalMap(R);

    // uv.x = clamp(uv.x, -0.1, 1.0);

    // vec3 F = fresnel_schlick(cosLo, F0);
    vec3 F = fresnel_schlick_roughness(cosLo, F0, roughness);
    vec3 kS = F;
    vec3 kD = 1.0 - kS;
    kD *= 1.0 - metalness;


	// Get diffuse contribution factor (as with direct lighting).
	// vec3 kd = mix(vec3(1.0) - F, vec3(0.0), metalness);

    vec3 irradiance = texture(skyboxTexture, uv).rgb;
    vec3 diffuse    = vec3(0.03) * albedo;

    const float MAX_REFLECTION_LOD = 4.0;
    vec3 prefilteredColor = textureLod(skyboxTexture, uv, roughness * MAX_REFLECTION_LOD).rgb;   
    vec2 envBRDF  = texture(specularBRDF, vec2(cosLo, roughness)).rg;
    vec3 specular = prefilteredColor * (kS * envBRDF.x + envBRDF.y);

    vec3 ambient    = (kD * diffuse + specular);

    vec3 final = ambient + Lo;
    final = aces(final);

    color = vec4(final, alpha);
    // color = vec4(normalize(v_Normal), alpha);
}