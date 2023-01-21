#version 300 es
precision highp float;

in vec2 v_FragPos;

layout(location = 0) out vec4 out_Color;

uniform sampler2D u_Mip;
uniform sampler2D u_PrevMip;
uniform vec2 u_Direction;
uniform vec2 u_Resolution;
uniform int u_Stage;
uniform float u_FilterRadius;

#define HALF_MAX        65504.0 // (2 - 2^-10) * 2^15
#define HALF_MAX_MINUS1 65472.0 // (2 - 2^-9) * 2^15
#define EPSILON         1.0e-4
#define PI              3.14159265359
#define TWO_PI          6.28318530718
#define FOUR_PI         12.56637061436
#define INV_PI          0.31830988618
#define INV_TWO_PI      0.15915494309
#define INV_FOUR_PI     0.07957747155
#define HALF_PI         1.57079632679
#define INV_HALF_PI     0.636619772367

#define FLT_EPSILON     1.192092896e-07 // Smallest positive number, such that 1.0 + FLT_EPSILON != 1.0
#define FLT_MIN         1.175494351e-38 // Minimum representable positive floating-point number
#define FLT_MAX         3.402823466e+38 // Maximum representable floating-point number

vec4 QuadraticThreshold(vec4 color, float threshold, vec3 curve) {
    // Pixel brightness
    float br = max(max(color.r, color.g), color.b);

    // Under-threshold part: quadratic curve
    float rq = clamp(br - curve.x, 0.0, curve.y);
    rq = curve.z * rq * rq;

    // Combine and apply the brightness response curve.
    color *= max(rq, br - threshold) / max(br, EPSILON);

    return color;
}

vec3 DownSample(sampler2D sampler, vec2 texCoord) {
    vec2 u_Resolution = 1.0 / u_Resolution;
    float x = u_Resolution.x;
    float y = u_Resolution.y;

    // Take 13 samples around current texel:
    // a - b - c
    // - j - k -
    // d - e - f
    // - l - m -
    // g - h - i
    // === ('e' is the current texel) ===
    vec3 a = texture(sampler, vec2(texCoord.x - 2.0*x, texCoord.y + 2.0*y)).rgb;
    vec3 b = texture(sampler, vec2(texCoord.x,       texCoord.y + 2.0*y)).rgb;
    vec3 c = texture(sampler, vec2(texCoord.x + 2.0*x, texCoord.y + 2.0*y)).rgb;

    vec3 d = texture(sampler, vec2(texCoord.x - 2.0*x, texCoord.y)).rgb;
    vec3 e = texture(sampler, vec2(texCoord.x,       texCoord.y)).rgb;
    vec3 f = texture(sampler, vec2(texCoord.x + 2.0*x, texCoord.y)).rgb;

    vec3 g = texture(sampler, vec2(texCoord.x - 2.0*x, texCoord.y - 2.0*y)).rgb;
    vec3 h = texture(sampler, vec2(texCoord.x,       texCoord.y - 2.0*y)).rgb;
    vec3 i = texture(sampler, vec2(texCoord.x + 2.0*x, texCoord.y - 2.0*y)).rgb;

    vec3 j = texture(sampler, vec2(texCoord.x - x, texCoord.y + y)).rgb;
    vec3 k = texture(sampler, vec2(texCoord.x + x, texCoord.y + y)).rgb;
    vec3 l = texture(sampler, vec2(texCoord.x - x, texCoord.y - y)).rgb;
    vec3 m = texture(sampler, vec2(texCoord.x + x, texCoord.y - y)).rgb;

    // Apply weighted distribution:
    // 0.5 + 0.125 + 0.125 + 0.125 + 0.125 = 1
    // a,b,d,e * 0.125
    // b,c,e,f * 0.125
    // d,e,g,h * 0.125
    // e,f,h,i * 0.125
    // j,k,l,m * 0.5
    // This shows 5 square areas that are being sampled. But some of them overlap,
    // so to have an energy preserving downsample we need to make some adjustments.
    // The weights are the distributed, so that the sum of j,k,l,m (e.g.)
    // contribute 0.5 to the final color output. The code below is written
    // to effectively yield this sum. We get:
    // 0.125*5 + 0.03125*4 + 0.0625*4 = 1
    vec3 downsample = e*0.125;
    downsample += (a+c+g+i)*0.03125;
    downsample += (b+d+f+h)*0.0625;
    downsample += (j+k+l+m)*0.125;

    return downsample;
}

vec3 UpSample(sampler2D sampler, vec2 texCoord) {
    // The filter kernel is applied with a radius, specified in texture
    // coordinates, so that the radius will vary across mip resolutions.
    float x = u_FilterRadius;
    float y = u_FilterRadius;

    // Take 9 samples around current texel:
    // a - b - c
    // d - e - f
    // g - h - i
    // === ('e' is the current texel) ===
    vec3 a = texture(sampler, vec2(texCoord.x - x, texCoord.y + y)).rgb;
    vec3 b = texture(sampler, vec2(texCoord.x,     texCoord.y + y)).rgb;
    vec3 c = texture(sampler, vec2(texCoord.x + x, texCoord.y + y)).rgb;

    vec3 d = texture(sampler, vec2(texCoord.x - x, texCoord.y)).rgb;
    vec3 e = texture(sampler, vec2(texCoord.x,     texCoord.y)).rgb;
    vec3 f = texture(sampler, vec2(texCoord.x + x, texCoord.y)).rgb;

    vec3 g = texture(sampler, vec2(texCoord.x - x, texCoord.y - y)).rgb;
    vec3 h = texture(sampler, vec2(texCoord.x,     texCoord.y - y)).rgb;
    vec3 i = texture(sampler, vec2(texCoord.x + x, texCoord.y - y)).rgb;

    // Apply weighted distribution, by using a 3x3 tent filter:
    //  1   | 1 2 1 |
    // -- * | 2 4 2 |
    // 16   | 1 2 1 |
    vec3 upsample = e*4.0;
    upsample += (b+d+f+h)*2.0;
    upsample += (a+c+g+i);
    upsample *= 1.0 / 16.0;

    return upsample;
}

//float4 _Threshold; x: threshold value (linear), y: threshold - knee, z: knee * 2, w: 0.25 / knee
//float4 _Params; x: clamp, yzw: unused
vec3 Prefilter(vec4 color) {
    float threshold = 20.5;
    float knee = 0.5;
    vec3 params = vec3(threshold - knee, knee * 2.0, 0.25 / knee);

    return QuadraticThreshold(color, 1.0, params).rgb;
}

void main() {
    vec4 color = texture(u_Mip, v_FragPos);

    if(u_Stage == 1) {
        out_Color = vec4(Prefilter(color), 1.0);
        return;
    } if(u_Stage == 2) {
        out_Color = vec4(DownSample(u_Mip, v_FragPos), 1.0);
        return;
    } else if(u_Stage == 3) {
        out_Color = vec4(UpSample(u_Mip, v_FragPos), 1.0);
        return;
    }

    out_Color = vec4(1.0);
}

