#version 300 es
precision highp float;

in vec2 texCoords;

out vec2 fragColor;

uniform sampler2D posTex;

void main(){
	vec2 color = texture(posTex, texCoords).rg;
	fragColor = color*0.9;
}
