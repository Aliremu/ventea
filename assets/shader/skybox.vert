#version 300 es
precision highp float;

layout(location = 0) in vec3 Position;
layout(location = 1) in vec2 TexCoord;
layout(location = 2) in vec3 Normal;

out vec3 v_TexCoord;

uniform mat4 View;
uniform mat4 Projection;

void main() {
    v_TexCoord = Position;

     vec4 pos = Projection * mat4(mat3(View)) * vec4(Position, 1.0);
     gl_Position = pos.xyww;
}