#version 300 es
precision highp float;

in vec2 texCoords;

out vec4 fragColor;

uniform sampler2D tex;

void main(){
	vec4 color =  texture(tex, texCoords);
	//set alpha to 1.0 so that the texture is visible
	color.a = 1.0;
	fragColor = color;
}
