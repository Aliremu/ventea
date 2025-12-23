//Vertex#version 300 es
precision highp float;

layout(location = 0) in vec3 position;
layout(location = 1) in vec2 tex_coord;

out vec2 v_TexCoord;

uniform mat4 u_LightSpace;
uniform int u_Offset;
uniform sampler2D u_TransformTexture;

void main() {
    int pid = 4 * u_Offset + 4 * gl_InstanceID;
    int w = 512;
    int h = 512;
    ivec2 p1 = ivec2((pid + 0) % w, (pid + 0) / w);
    ivec2 p2 = ivec2((pid + 1) % w, (pid + 1) / w);
    ivec2 p3 = ivec2((pid + 2) % w, (pid + 2) / w);
    ivec2 p4 = ivec2((pid + 3) % w, (pid + 3) / w);

    mat4 transform = mat4(
        texelFetch(u_TransformTexture, p1, 0),
        texelFetch(u_TransformTexture, p2, 0),
        texelFetch(u_TransformTexture, p3, 0),
        texelFetch(u_TransformTexture, p4, 0)
    );

    v_TexCoord = tex_coord;

    gl_Position = u_LightSpace * transform * vec4(position, 1.0);
}

//Fragment#version 300 es
precision highp float;

in vec2 v_TexCoord;

uniform sampler2D u_Sample;

void main() {             
    vec4 color = texture(u_Sample, v_TexCoord);
    if(color.a < 0.5) discard;

    // gl_FragDepth = gl_FragCoord.z;
}
