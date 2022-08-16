#version 300 es
precision highp float;

in vec3 v_Normal;
in vec3 v_FragPos;

layout(location = 0) out vec4 color;

uniform sampler2D dirt_diff;
uniform sampler2D dirt_norm;

uniform sampler2D path_diff;
uniform sampler2D path_norm;

uniform sampler2D rock_diff;
uniform sampler2D rock_norm;

uniform sampler2D snow_diff;
uniform sampler2D snow_norm;

uniform sampler2D noise;

uniform samplerCube skybox;

uniform mat4 Model;
uniform mat4 View;

#define LUMINANCE_PRESERVATION 0.75

#define EPSILON 1e-10

float saturate(float v) {
    return clamp(v, 0.0, 1.0);
}
vec2 saturate(vec2 v) {
    return clamp(v, vec2(0.0), vec2(1.0));
}
vec3 saturate(vec3 v) {
    return clamp(v, vec3(0.0), vec3(1.0));
}
vec4 saturate(vec4 v) {
    return clamp(v, vec4(0.0), vec4(1.0));
}

vec3 ColorTemperatureToRGB(float temperatureInKelvins) {
    vec3 retColor;

    temperatureInKelvins = clamp(temperatureInKelvins, 1000.0, 40000.0) / 100.0;

    if(temperatureInKelvins <= 66.0) {
        retColor.r = 1.0;
        retColor.g = saturate(0.39008157876901960784 * log(temperatureInKelvins) - 0.63184144378862745098);
    } else {
        float t = temperatureInKelvins - 60.0;
        retColor.r = saturate(1.29293618606274509804 * pow(t, -0.1332047592));
        retColor.g = saturate(1.12989086089529411765 * pow(t, -0.0755148492));
    }

    if(temperatureInKelvins >= 66.0)
        retColor.b = 1.0;
    else if(temperatureInKelvins <= 19.0)
        retColor.b = 0.0;
    else
        retColor.b = saturate(0.54320678911019607843 * log(temperatureInKelvins - 10.0) - 1.19625408914);

    return retColor;
}

mat3 cotangent_frame(vec3 N, vec3 p, vec2 uv) {
    // get edge vectors of the pixel triangle
    vec3 dp1 = dFdx(p);
    vec3 dp2 = dFdy(p);
    vec2 duv1 = dFdx(uv);
    vec2 duv2 = dFdy(uv);

    // solve the linear system
    vec3 dp2perp = cross(dp2, N);
    vec3 dp1perp = cross(N, dp1);
    vec3 T = dp2perp * duv1.x + dp1perp * duv2.x;
    vec3 B = dp2perp * duv1.y + dp1perp * duv2.y;

    // construct a scale-invariant frame 
    float invmax = inversesqrt(max(dot(T, T), dot(B, B)));
    return mat3(T * invmax, B * invmax, N);
}

vec3 perturb_normal(sampler2D norm, vec3 N, vec3 V, vec2 texcoord) {
    // assume N, the interpolated vertex normal and 
    // V, the view vector (vertex to eye)
    vec3 map = texture(norm, texcoord).xyz;
    map = map * 255. / 127. - 128. / 127.;
    mat3 TBN = cotangent_frame(N, -V, texcoord);
    return normalize(TBN * map);
}

vec3 perturb_normal(vec3 map, vec3 N, vec3 V, vec2 texcoord) {
    map = map * 255. / 127. - 128. / 127.;
    mat3 TBN = cotangent_frame(N, -V, texcoord);
    return normalize(TBN * map);
}

vec4 hash4(vec2 p) {
    return fract(sin(vec4(1.0 + dot(p, vec2(37.0, 17.0)), 2.0 + dot(p, vec2(11.0, 47.0)), 3.0 + dot(p, vec2(41.0, 29.0)), 4.0 + dot(p, vec2(23.0, 31.0)))) * 103.0);
}

/*vec4 textureNoTile( sampler2D samp, in vec2 uv )
{
    vec2 p = floor( uv );
    vec2 f = fract( uv );
	
    // derivatives (for correct mipmapping)
    vec2 ddx = dFdx( uv );
    vec2 ddy = dFdy( uv );
    
    // voronoi contribution
    vec4 va = vec4( 0.0 );
    float wt = 0.0;
    for( int j=-1; j<=1; j++ )
    for( int i=-1; i<=1; i++ )
    {
        vec2 g = vec2( float(i), float(j) );
        vec4 o = hash4( p + g );
        vec2 r = g - f + o.xy;
        float d = dot(r,r);
        float w = exp(-5.0*d );
        vec4 c = textureGrad( samp, uv + o.zw, ddx, ddy );
        va += w*c;
        wt += w;
    }
	
    // normalization
    return va/wt;
}*/

float sum(vec3 v) {
    return v.x + v.y + v.z;
}

vec4 textureNoTile(sampler2D samp, sampler2D cache, in vec2 x, float v) {
    float k = texture(cache, 0.005 * x).x; // cheap (cache friendly) lookup

    vec2 duvdx = dFdx(x);
    vec2 duvdy = dFdy(x);

    float l = k * 8.0;
    float f = fract(l);

#if 1
    float ia = floor(l); // my method
    float ib = ia + 1.0;
#else
    float ia = floor(l + 0.5); // suslik's method (see comments)
    float ib = floor(l);
    f = min(f, 1.0 - f) * 2.0;
#endif    

    vec2 offa = sin(vec2(3.0, 7.0) * ia); // can replace with any other hash
    vec2 offb = sin(vec2(3.0, 7.0) * ib); // can replace with any other hash

    vec3 cola = textureGrad(samp, x + v * offa, duvdx, duvdy).xyz;
    vec3 colb = textureGrad(samp, x + v * offb, duvdx, duvdy).xyz;

    return vec4(mix(cola, colb, smoothstep(0.2, 0.8, f - 0.1 * sum(cola - colb))), 1.0);
}

vec3 NormalBlend_UnpackedRNM(vec3 n1, vec3 n2) {
    n1 += vec3(0, 0, 1);
    n2 *= vec3(-1, -1, 1);

    return n1 * dot(n1, n2) / n1.z - n2;
}

vec4 triplanar(sampler2D samp, vec3 uv, vec3 blending) {
    return normalize(texture(samp, uv.yz) * blending.x + texture(samp, uv.xz) * blending.y + texture(samp, uv.xy) * blending.z);
}

vec4 triplanar_notile(sampler2D samp, vec3 uv, vec3 blending) {
    return normalize(textureNoTile(samp, noise, uv.yz, 0.5) * blending.x + textureNoTile(samp, noise, uv.xz, 0.5) * blending.y + textureNoTile(samp, noise, uv.xy, 0.5) * blending.z);
}

void main() {
    vec3 viewPos = -View[3].xyz * mat3(View);
    vec3 viewDir = normalize(viewPos - v_FragPos);
    vec3 lightDir = normalize(vec3(0.5, -0.5, 0.5)); //normalize(lightPos - v_FragPos);

    vec3 lightColor = ColorTemperatureToRGB(3000.0);//vec3(1.0, 0.7216, 0.3373);

    float height = v_FragPos.y / 100.0;

    vec3 cock = normalize(v_Normal);
    vec3 uv = v_FragPos;
    //uv /= 64.0;

    vec3 blending = abs(cock);
    blending = normalize(max(blending, 0.00001)); // Force weights to sum to 1.0
    float b = (blending.x + blending.y + blending.z);
    blending /= vec3(b, b, b);

    float slope = 1.0 - cock.y;

    //color = vec4(slope, slope, slope, 1.0);
    //return;

    vec4 kek = triplanar(noise, uv, blending);

    vec4 dirtCol = triplanar(dirt_diff, uv / 8.0, blending);
    vec4 dirtNorm = triplanar(dirt_norm, uv / 8.0, blending);

    vec4 diffColor = dirtCol;
    vec4 normColor = dirtNorm;

    float blendAmount = 0.0;

    if(slope < 0.2) {
        blendAmount = slope / 0.2;
        if(height < 0.7) {
            vec4 pathCol = triplanar_notile(path_diff, uv / 8.0, blending);
            vec4 pathNorm = triplanar_notile(path_norm, uv / 8.0, blending);
            diffColor = mix(pathCol, dirtCol, blendAmount);
            normColor = mix(pathNorm, dirtNorm, blendAmount);
        } else {
            vec4 snowCol = triplanar(snow_diff, uv / 8.0, blending);
            vec4 snowNorm = triplanar(snow_norm, uv / 8.0, blending);
            diffColor = mix(snowCol, dirtCol, blendAmount);
            normColor = mix(snowNorm, dirtNorm, blendAmount);
        }
    }

    if((slope < 0.7) && (slope >= 0.2)) {
        blendAmount = (slope - 0.2) * (1.0 / (0.7 - 0.2));

        vec4 rockCol = triplanar_notile(rock_diff, uv / 32.0, blending);
        vec4 rockNorm = triplanar_notile(rock_norm, uv / 32.0, blending);

        if(height < 0.7) {
            vec4 dirtCol = triplanar(dirt_diff, uv / 8.0, blending);
            vec4 dirtNorm = triplanar(dirt_norm, uv / 8.0, blending);
            diffColor = mix(dirtCol, rockCol, blendAmount);
            normColor = mix(dirtNorm, rockNorm, blendAmount);
        } else {
            vec4 snowCol = triplanar(snow_diff, uv / 8.0, blending);
            vec4 snowNorm = triplanar(snow_norm, uv / 8.0, blending);
            diffColor = mix(snowCol, rockCol, blendAmount);
            normColor = mix(snowNorm, rockNorm, blendAmount);
        }
    }

    if(slope >= 0.7) {
        vec4 rockCol = triplanar_notile(rock_diff, uv / 32.0, blending);
        vec4 rockNorm = triplanar_notile(rock_norm, uv / 32.0, blending);
        diffColor = rockCol;
        normColor = rockNorm;
    }

    vec2 ux = uv.yz;
    vec2 uy = uv.xz;
    vec2 uz = uv.xy;

    float nX = normColor.r;
    float nY = normColor.g;
    float nZ = normColor.b;

    vec3 lightPos = vec3(50.0, 100.0, 0.0);

    // ambient
    float ambientStrength = 0.7;
    vec3 ambient = ambientStrength * lightColor;

    // diffuse 

    vec3 norm = normalize(normColor.rgb);//perturb_normal(normColor.rgb, v_Normal, viewDir, ux) + perturb_normal(normColor.rgb, v_Normal, viewDir, uy) + perturb_normal(normColor.rgb, v_Normal, viewDir, uz);
    //vec3 norm = normalize(v_Normal);

    float diff = max(dot(norm, lightDir), 0.0);
    vec3 diffuse = diff * lightColor;

    // specular
    float specularStrength = 0.7;
    vec3 reflectDir = reflect(-lightDir, norm);
    float spec = pow(max(dot(viewDir, reflectDir), 0.0), 64.0);
    vec3 specular = specularStrength * spec * lightColor;

    vec3 result = (ambient + diffuse + specular) * diffColor.rgb;

    const float gamma = 2.2;
    //vec3 mapped = vec3(1.0) - exp(-result * 1.0);
    // gamma correction 
    vec3 mapped = pow(result, vec3(1.0 / gamma));

    color = vec4(mapped, 1.0);
}