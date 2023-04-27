#version 300 es
precision highp float;

in vec2 texCoords;

out vec2 fragColor;

uniform sampler2D posTex;

void main(){
	vec2 disp = vec2(1.0/float(textureSize(posTex, 0).x), 0);
	vec2 color = texture(posTex, texCoords).rg;
	color *= 14.0;
	color += texture(posTex, texCoords+disp).rg + texture(posTex, texCoords-disp).rg;
	color /= 16.0;
	vec2 normalized = normalize(color);
	fragColor = (3.0*color + normalized)/4.0;
}
