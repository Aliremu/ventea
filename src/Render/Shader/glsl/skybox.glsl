//Vertex#version 300 es
#extension GL_ANGLE_multi_draw : require
precision highp float;

layout(location = 0) in vec3 position;
layout(location = 1) in vec3 normal;
layout(location = 2) in vec2 tex_coord;

out vec3 v_FragPos;
out vec3 v_Normal;
out vec2 v_TexCoord;

uniform mat4 view;
uniform mat4 proj;

void main() {
    // vec4 local = trans * vec4(position, 1.0);
    v_TexCoord = tex_coord;

    vec4 pos = proj * mat4(mat3(view)) * vec4(position, 1.0);
    gl_Position = pos.xyww;
}

//Fragment#version 300 es
#extension GL_ANGLE_multi_draw : require
precision highp float;

in vec3 v_FragPos;
in vec3 v_Normal;
in vec2 v_TexCoord;

layout(location = 0) out vec4 color;

uniform mat4 view;
uniform mat4 proj;

uniform sampler2D skyboxTexture;

void main() {
    vec2 uv = v_TexCoord;
    uv.y = 1.0 - uv.y;
    vec4 sampled = texture(skyboxTexture, uv);

    color = sampled;
}