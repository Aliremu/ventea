#version 300 es
precision highp float;

layout(location = 0) in vec3 Position;
layout(location = 1) in vec2 TexCoord;

out vec2 v_TexCoord;

uniform mat4 Model;
uniform mat4 LightSpace;

void main() {
    v_TexCoord = TexCoord;
    gl_Position = LightSpace * Model * vec4(Position, 1.0);
}