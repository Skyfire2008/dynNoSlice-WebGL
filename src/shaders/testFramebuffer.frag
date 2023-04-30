#version 300 es
precision highp float;

in vec2 texCoords;

out vec2 fragColor;

uniform sampler2D posTex;

void main(){
	vec2 disp = vec2(0.0, 1.0/float(textureSize(posTex, 0).y));
	vec2 pos = texture(posTex, texCoords).rg;
	
	vec2 centre = (pos + texture(posTex, texCoords+disp).rg + texture(posTex, texCoords-disp).rg)/3.0;

	fragColor = mix(pos, centre, 0.5);
}
