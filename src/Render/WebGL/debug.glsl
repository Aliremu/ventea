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

void main() {
    // color = vec4(0.0, 1.0, 0.0, 1.0);
    color = vec4(0.7, 0.7, 0.7, 1.0);
}