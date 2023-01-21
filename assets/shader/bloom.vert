#version 300 es
precision highp float;

layout(location = 0) in vec2 Position;

out vec2 v_FragPos;

void main() {
    v_FragPos = Position;
    gl_Position = vec4(Position * 2.0 - 1.0, 0.0, 1.0);
}