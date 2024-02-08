#version 300 es
precision highp float;

in vec2 texCoords;

out vec4 fragColor;

uniform sampler2D tex;

void main(){
	vec4 color =  texture(tex, texCoords);
	fragColor = color;
}
