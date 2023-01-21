#version 300 es
precision highp float;

in vec2 v_TexCoord;

uniform sampler2D u_Sample;

void main() {             
    vec4 color = texture(u_Sample, v_TexCoord);
    if(color.a < 0.5) discard;

    // gl_FragDepth = gl_FragCoord.z;
}