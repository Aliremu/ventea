#version 300 es
precision highp float;

in vec2 v_FragPos;

layout(location = 0) out vec4 out_Color;

uniform sampler2D u_Sample;
uniform vec2 u_Resolution;
uniform vec2 u_Direction;

vec4 blur9(sampler2D image, vec2 uv, vec2 resolution, vec2 direction) {
  vec4 color = vec4(0.0);
  vec2 off1 = vec2(1.3846153846) * direction;
  vec2 off2 = vec2(3.2307692308) * direction;
  color += texture(image, uv) * 0.2270270270;
  color += texture(image, uv + (off1 / resolution)) * 0.3162162162;
  color += texture(image, uv - (off1 / resolution)) * 0.3162162162;
  color += texture(image, uv + (off2 / resolution)) * 0.0702702703;
  color += texture(image, uv - (off2 / resolution)) * 0.0702702703;
  return color;
}

void main() {
  out_Color = vec4(blur9(u_Sample, v_FragPos, u_Resolution, u_Direction).rgb, 1.0);
}