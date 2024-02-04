#version 300 es
precision highp float;

in vec2 texCoords;

out vec4 fragColor;

uniform sampler2D posTex;

//TODO: this is a placeholder, implement it
void main(){
	fragColor = texture(posTex, texCoords).rgba;
}
