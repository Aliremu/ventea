//Vertex#version 300 es
precision highp float;

layout(location = 0) in vec3 position;
layout(location = 1) in vec3 normal;
layout(location = 2) in vec2 tex_coord;

out vec3 v_FragPos;
out vec3 v_Normal;
out vec2 v_TexCoord;

uniform mat4 view;
uniform mat4 proj;
uniform mat4 model;

void main() {
    vec4 local = model * vec4(position, 1.0);
    v_FragPos = vec3(local);
    v_Normal = mat3(transpose(inverse(model))) * normal;
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

layout(std140) uniform pbr_material {
	vec4 base_color;
    float metallic_factor;
    float roughness_factor;
    float alpha;
};

uniform sampler2D albedoTexture;
uniform sampler2D normalTexture;
// uniform sampler2D ao_m_rTexture;
// uniform sampler2D occlusionTexture;

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

void main() {
    vec4 sampled = texture(albedoTexture, v_TexCoord);
    vec3 albedo = sampled.rgb * base_color.rgb;
    float alpha = sampled.a * base_color.a;
    // vec3 normal = texture(normalTexture, v_TexCoord).rgb;

    if(alpha < 0.5) {
        discard;
    }

    vec3 normal = normalize(v_Normal);

    if(textureSize(normalTexture, 0).x > 1) {
        normal = PerturbNormal(v_FragPos, normal, normalTexture, v_TexCoord); // perturb_normal(Normal, Eye, v_TexCoord);
    }

    vec3 eye = -view[3].xyz * mat3(view);

    vec3 lightPos = vec3(0.0, 10.0, 0.0);
    vec3 lightDir = normalize(v_FragPos - lightPos);
    // vec3 lightDir = vec3(0.0, -0.5, -1.0);
    vec3 viewDir = normalize(eye - v_FragPos);

    float thing = pow(dot(normal, -lightDir) * 0.5 + 0.5, 2.0);

    color = vec4(thing * albedo, alpha);
    // color = vec4(normalize(v_Normal), alpha);
}