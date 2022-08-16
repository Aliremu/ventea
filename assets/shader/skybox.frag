#version 300 es
precision highp float;

in vec3 v_TexCoord;

layout(location = 0) out vec4 color;

uniform samplerCube skybox;

void main() {
    color = texture(skybox, v_TexCoord);
}