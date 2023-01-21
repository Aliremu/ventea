#version 300 es
precision highp float;

in vec2 v_TexCoord;
in vec3 v_Normal;
in vec3 v_FragPos;
in vec3 v_Scale;
in vec3 v_NoModel;
in vec4 v_FragPosLightSpace;

layout(location = 0) out vec4 color;

uniform sampler2D u_Sample;
uniform sampler2D u_Normal;
uniform sampler2D u_ShadowMap1;
uniform sampler2D u_ShadowMap2;
uniform sampler2D u_ShadowMap3;
uniform samplerCube skybox;

uniform vec3 LightDirection;
uniform mat4 LightSpace[3];
uniform float CascadeDistances[3];
uniform int CascadeCount;
uniform float FarPlane;

uniform mat4 Model;
uniform mat4 View;

struct BaseLight                                                                    
{                                                                                   
    vec3 Color;                                                                     
    float AmbientIntensity;                                                         
    float DiffuseIntensity;                                                         
};                                                                                  
                                                                                    
struct DirectionalLight                                                             
{                                                                                   
    BaseLight Base;                                                          
    vec3 Direction;                                                                 
};                                                                                  
                                                                                    
struct Attenuation                                                                  
{                                                                                   
    float Constant;                                                                 
    float Linear;                                                                   
    float Exp;                                                                      
};                                                                                  
                                                                                    
struct PointLight                                                                           
{                                                                                           
    BaseLight Base;                                                                  
    vec3 Position;                                                                          
    Attenuation Atten;                                                                      
};                                                                                          
                                                                                            
struct SpotLight                                                                            
{                                                                                           
    PointLight Base;                                                                 
    vec3 Direction;                                                                         
    float Cutoff;                                                                           
};    

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

vec3 perturb_normal(sampler2D tex, vec3 N, vec3 V, vec2 texcoord) {
    vec3 map = texture(tex, texcoord).rgb;
    map = map * 2.0 - 1.0;
    mat3 TBN = cotangent_frame(N, -V, texcoord);
    return normalize(TBN * map);
}

vec4 triplanar(sampler2D samp, vec3 uv, vec3 blending) {
    return normalize(texture(samp, uv.yz) * blending.x + texture(samp, uv.xz) * blending.y + texture(samp, uv.xy) * blending.z);
}

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

float CalcShadowFactor(vec4 LightSpacePos, vec3 Normal, vec3 LightDirection) {                                                                                           
    vec3 ProjCoords = LightSpacePos.xyz / LightSpacePos.w;                                  
    vec2 UVCoords;                                                                       
    UVCoords.x = 0.5 * ProjCoords.x + 0.5;                                                  
    UVCoords.y = 0.5 * ProjCoords.y + 0.5;                                                  
    float z = 0.5 * ProjCoords.z + 0.5;                                                     
    float Depth = texture(u_ShadowMap1, UVCoords).r; 
    float bias = max(0.01 * (1.0 + dot(Normal, LightDirection)), 0.005);    
    float shadow = 0.0;

    vec2 texelSize = 1.0 / vec2(textureSize(u_ShadowMap1, 0));
    for(int x = -1; x <= 1; ++x) {
        for(int y = -1; y <= 1; ++y) {
            float pcfDepth = texture(u_ShadowMap1, UVCoords + vec2(x, y) * texelSize).r; 
            shadow += z - bias > pcfDepth  ? 0.0 : 1.0;        
        }    
    }
    shadow /= 9.0;                                      

    if(z > 1.0)
        shadow = 0.0;
        
    return shadow;                                                                  
}                                                                                           
   
float CalcShadowFactorCSM(vec3 FragPos, vec3 Normal, vec3 LightDirection) {   
    vec4 FragPosViewSpace = View * vec4(FragPos, 1.0);
    float depthValue = abs(FragPosViewSpace.z);

    int layer = -1;
    for (int i = 0; i < CascadeCount; ++i) {
        if (depthValue < CascadeDistances[i]) {
            layer = i;
            break;
        }
    }
    if (layer == -1) {
        layer = CascadeCount;
    }

    vec4 FragPosLightSpace = LightSpace[layer] * vec4(FragPos, 1.0);

    vec3 ProjCoords = FragPosLightSpace.xyz / FragPosLightSpace.w;                                  
    vec2 UVCoords;                                                                       
    UVCoords.x = 0.5 * ProjCoords.x + 0.5;                                                  
    UVCoords.y = 0.5 * ProjCoords.y + 0.5;                                                  
    float z = 0.5 * ProjCoords.z + 0.5;      

    if (z > 1.0) {
        return 1.0;
    }

    //float Depth = texture(u_ShadowMap1, UVCoords).r; 
    float bias = max(0.05 * (1.0 + dot(Normal, LightDirection)), 0.005);    
    const float biasModifier = 0.5;
    if (layer == CascadeCount) {
        bias *= 1.0 / (FarPlane * biasModifier);
    } else {
        bias *= 1.0 / (CascadeDistances[layer] * biasModifier);
    }

    float shadow = 0.0;

    vec2 texelSize = 1.0 / vec2(textureSize(u_ShadowMap1, 0));
    for(int x = -1; x <= 1; ++x) {
        for(int y = -1; y <= 1; ++y) {
            if(layer == 0) {
                float pcfDepth = texture(u_ShadowMap1, UVCoords + vec2(x, y) * texelSize).r; 
                shadow += z - bias > pcfDepth  ? 0.0 : 1.0;        
            }
            if(layer == 1) {
                float pcfDepth = texture(u_ShadowMap2, UVCoords + vec2(x, y) * texelSize).r; 
                shadow += z - bias > pcfDepth  ? 0.0 : 1.0;        
            }
            if(layer == 2) {
                float pcfDepth = texture(u_ShadowMap3, UVCoords + vec2(x, y) * texelSize).r; 
                shadow += z - bias > pcfDepth  ? 0.0 : 1.0;        
            }
        }    
    }
    shadow /= 9.0;                                      

    if(z > 1.0)
        shadow = 0.0;
        
    return shadow;                                                                  
}

vec4 CalcLightInternal(BaseLight Light, vec3 Eye, vec3 Normal, float ShadowFactor, vec3 LightDirection) {
    vec4 AmbientColor = vec4(Light.Color * Light.AmbientIntensity, 1.0);
    float DiffuseFactor = dot(Normal, -LightDirection);                                     
                                                                                            
    vec4 DiffuseColor  = vec4(0.0);    

    float SpecularIntensity = 0.0;
    float SpecularFactor = 0.0;                                                 
    vec4 SpecularColor = vec4(0.0);                                                     

                                                                                                   
    if (DiffuseFactor > 0.0) {                                                                
        DiffuseColor = vec4(Light.Color * Light.DiffuseIntensity * DiffuseFactor, 1.0);      
                                                                                            
        vec3 VertexToEye = normalize(Eye - v_FragPos);                             
        vec3 LightReflect = normalize(reflect(LightDirection, Normal));                     
        float SpecularFactor = dot(VertexToEye, LightReflect);                                      
        if (SpecularFactor > 0.0) {                                                           
            SpecularFactor = pow(SpecularFactor, 0.0);                               
            SpecularColor = vec4(Light.Color, 1.0) * SpecularIntensity * SpecularFactor;                         
        }                                                                                   
    }                                                                                       
                                                                                            
    return (AmbientColor + ShadowFactor * (DiffuseColor + SpecularColor));       
}

vec4 CalcDirLight(vec3 Eye, vec3 Normal, vec4 LightSpacePos) {
    float day = -LightDirection.y * 0.5 + 0.5;
    float temp = day * (5780.0 - 3700.0) + 3700.0;
    //vec3 LightColor = ColorTemperatureToRGB(temp);
    //vec3 LightColor = vec3(0.1, 0.2, 0.9);
    vec3 LightColor = vec3(1.0);

    //BaseLight bl = BaseLight(LightColor, 0.05, 0.3);
    BaseLight bl = BaseLight(LightColor, 0.3, 0.9);

    //float ShadowFactor = CalcShadowFactor(LightSpace[0] * vec4(v_FragPos, 1.0), Normal, normalize(LightDirection));
    float ShadowFactor = CalcShadowFactorCSM(v_FragPos, Normal, normalize(LightDirection));
    return CalcLightInternal(bl, Eye, Normal, ShadowFactor, normalize(LightDirection));  
}

vec4 CalcPointLight(PointLight l, vec3 Eye, vec3 Normal, vec4 LightSpacePos) {                                                                                           
    vec3 LightDirection = v_FragPos - l.Position;                                           
    float Distance = length(LightDirection);                                                
    LightDirection = normalize(LightDirection);                                             
    //float ShadowFactor = CalcShadowFactor(LightSpacePos, Normal, LightDirection);
    float ShadowFactor = CalcShadowFactorCSM(v_FragPos, Normal, LightDirection);
                                                                                            
    vec4 Color = CalcLightInternal(l.Base, Eye, Normal, ShadowFactor, LightDirection);           
    float AttenuationFactor =  l.Atten.Constant +                                                 
                         l.Atten.Linear * Distance +                                        
                         l.Atten.Exp * Distance * Distance;                                 
                                                                                            
    return Color / AttenuationFactor;                                                             
}                                                                                           
                                                                                            
vec4 CalcSpotLight(SpotLight l, vec3 Eye, vec3 Normal, vec4 LightSpacePos) {                                                                                           
    vec3 LightToPixel = normalize(v_FragPos - l.Base.Position);                             
    float SpotFactor = dot(LightToPixel, l.Direction);                                      
                                                                                            
    if (SpotFactor > l.Cutoff) {                                                            
        vec4 Color = CalcPointLight(l.Base, Eye, Normal, LightSpacePos);                         
        return Color * (1.0 - (1.0 - SpotFactor) * 1.0/(1.0 - l.Cutoff));                   
    }                                                                                       
    else {                                                                                  
        return vec4(0,0,0,0);                                                               
    }                                                                                       
}      

vec3 perturbNormal( vec3 eye_pos, vec3 surf_norm, 
  vec2 uv_coords, vec3 normal_perturbation ) 
{
  vec3 q0 = dFdx( eye_pos.xyz );
  vec3 q1 = dFdy( eye_pos.xyz );
  vec2 st0 = dFdx( uv_coords.st );
  vec2 st1 = dFdy( uv_coords.st );

  vec3 S = normalize( q0 * st1.t - q1 * st0.t );
  vec3 T = normalize( -q0 * st1.s + q1 * st0.s );
  vec3 N = normalize( surf_norm );

  mat3 tsn = mat3( S, T, N );
  return normalize( tsn * normal_perturbation );
}

void main() {
    vec4 SampledColor = texture(u_Sample, v_TexCoord);
    if(SampledColor.a < 0.9) discard;

    vec3 Normal = normalize(v_Normal);
    vec3 Eye = -View[3].xyz * mat3(View);

    if(textureSize(u_Normal, 0).x > 2)
        Normal = perturb_normal(u_Normal, normalize(v_Normal), Eye - v_FragPos, v_TexCoord); // perturb_normal(Normal, Eye, v_TexCoord);
    
    /*vec4 FragPosViewSpace = View * vec4(v_FragPos, 1.0);
    float depthValue = abs(FragPosViewSpace.z);

    int layer = -1;
    for (int i = 0; i < CascadeCount; ++i) {
        if (depthValue < CascadeDistances[i]) {
            layer = i;
            break;
        }
    }
    if (layer == -1) {
        layer = CascadeCount;
    }

    color = vec4(0.0, 1.0, 0.0, 1.0);

    if(layer == 1) color = vec4(0.0, 0.0, 1.0, 1.0);
    if(layer == 2) color = vec4(1.0, 1.0, 0.0, 1.0);
    if(layer == 3) color = vec4(1.0, 0.0, 0.0, 1.0);*/

    vec4 Light = CalcDirLight(Eye, Normal, v_FragPosLightSpace);

    PointLight pl1 = PointLight(BaseLight(vec3(1.0, 0.0, 0.0), 0.9, 0.9), vec3(-58.5, 7.5, 12.5), Attenuation(0.0, 0.1, 0.0));
    PointLight pl2 = PointLight(BaseLight(vec3(0.0, 1.0, 0.0), 0.9, 0.9), vec3(4.2, 7.5, 11.0), Attenuation(0.0, 0.1, 0.0));
    PointLight pl3 = PointLight(BaseLight(vec3(0.0, 0.0, 1.0), 0.9, 0.9), vec3(32.0, 8.5, 7.0), Attenuation(0.0, 0.1, 0.0));
    PointLight pl4 = PointLight(BaseLight(vec3(0.9, 0.2, 0.8), 0.9, 0.9), vec3(51.0, 7.5, 11.0), Attenuation(0.0, 0.1, 0.0));

    PointLight sun = PointLight(BaseLight(vec3(1.0), 0.1, 0.3), -LightDirection, Attenuation(0.0, 0.1, 0.0));

    PointLight sp = PointLight(BaseLight(vec3(1.0), 0.5, 0.9), vec3(4, 1.5, 4), Attenuation(0.0, 0.1, 0.0));
    //Light += CalcPointLight(sp, Eye, Normal, v_FragPosLightSpace);
    //Light += CalcPointLight(pl1, Eye, Normal, v_FragPosLightSpace);
    //Light += CalcPointLight(pl2, Eye, Normal, v_FragPosLightSpace);
    //Light += CalcPointLight(pl3, Eye, Normal, v_FragPosLightSpace);
    //Light += CalcPointLight(pl4, Eye, Normal, v_FragPosLightSpace);
    //Light += CalcPointLight(sun, Eye, Normal, v_FragPosLightSpace);

    PointLight hehe = PointLight(BaseLight(vec3(1.0), 1.0, 1.0), vec3(-9.5, 9.0, -2.0), Attenuation(0.0, 0.01, 0.0));
    SpotLight sl = SpotLight(hehe, vec3(0.0, -1.0, 0.0), 0.8);

    //Light += CalcSpotLight(sl, Eye, Normal, v_FragPosLightSpace);
    //color = vec4(Normal, 1.0);
    color = vec4((SampledColor * Light).rgb, 1.0);
}