#version 300 es
precision highp float;

layout(location = 0) in vec3 Position;
layout(location = 1) in vec2 TexCoord;
layout(location = 2) in vec3 Normal;

out vec2 v_TexCoord;
out vec3 v_Normal;
out vec3 v_FragPos;
out vec3 v_Scale;
out vec3 v_NoModel;
out vec4 v_FragPosLightSpace;
/* layout(std140) uniform MVP {
    mat4 Model;
    mat4 View;
    mat4 Projection;
}; */

uniform mat4 Model;
uniform mat4 View;
uniform mat4 Projection;
uniform mat4 LightSpace[3];

void main() {
    vec3 scale = vec3(length(Model[0]), length(Model[1]), length(Model[2]));

    v_TexCoord = TexCoord;
    v_Normal = mat3(transpose(inverse(Model))) * Normal;  
    v_FragPos = vec3(Model * vec4(Position, 1.0));
    v_NoModel = vec3(View * Model * vec4(Position, 1.0));
    v_Scale   = vec3(View * Model * vec4(Normal, 1.0));

    v_FragPosLightSpace = Model * vec4(v_FragPos, 1.0);

    gl_Position = Projection * View * Model * vec4(Position, 1.0);
}