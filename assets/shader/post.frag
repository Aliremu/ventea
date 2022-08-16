#version 300 es
precision highp float;

in vec2 v_FragPos;

layout(location = 0) out vec4 out_Color;

uniform sampler2D u_Color;
uniform sampler2D u_Depth;
uniform sampler2D u_Bloom;

vec3 greyscale(vec3 color, float str) {
  float g = dot(color, vec3(0.299, 0.587, 0.114));
  return mix(color, vec3(g), str);
}

float warp = 0.75; // simulate curvature of CRT monitor
float scan = 0.75; // simulate darkness between scanlines

float LinearizeDepth(float depth, float near_plane, float far_plane) {
    float z = depth * 2.0 - 1.0; // Back to NDC 
    return (2.0 * near_plane * far_plane) / (far_plane + near_plane - z * (far_plane - near_plane));	
}

void main() {
  float depthValue = texture(u_Depth, v_FragPos).r;
  float linDepth = LinearizeDepth(depthValue, 0.1, 1000.0) / 50.0;
  vec4 testDepth = vec4(vec3(linDepth), 1.0);
  float fogAmount = smoothstep(3.2, 4.7, linDepth);

  const float gamma = 2.2;
  vec3 color = texture(u_Color, v_FragPos).rgb;
  vec4 bloom = texture(u_Bloom, v_FragPos);//.rgb;
  //color += bloom;

  vec3 mapped = vec3(1.0) - exp(-color * 1.0);
  // gamma correction 
  mapped = pow(mapped, vec3(1.0   / gamma));

  vec2 lol =  v_FragPos * (1.0 - v_FragPos.yx);
  float vig = lol.x * lol.y * 15.0;
  vig = pow(vig, 0.1);

  //vec4 bloom = texture(u_Bloom, v_FragPos);

  //color = mix(color, vec4(0.8, 0.9, 1.0, 1.0), fogAmount);
  out_Color = vec4(mapped, 1.0) + bloom; //vec4(vig * mapped, 1.0);
}