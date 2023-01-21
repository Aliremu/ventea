#version 300 es
precision highp float;

layout(location = 0) in vec3 Position;
layout(location = 2) in vec3 Normal;

out vec3 v_Normal;
out vec3 v_FragPos;
/* layout(std140) uniform MVP {
    mat4 Model;
    mat4 View;
    mat4 Projection;
}; */

uniform mat4 Model;
uniform mat4 View;
uniform mat4 Projection;

void main() {
    vec3 scale = vec3(length(Model[0]), length(Model[1]), length(Model[2]));

    v_Normal = mat3(transpose(inverse(Model))) * Normal;  
    v_FragPos = vec3(Model * vec4(Position, 1.0));
    //v_NoModel = scale * Position;
    //v_Scale = scale;

    gl_Position = Projection * View * Model * vec4(Position, 1.0);
}