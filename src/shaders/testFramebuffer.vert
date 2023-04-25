#version 300 es
precision highp float;

layout(location = 0) in vec2 posIn;
layout(location = 1) in vec2 uvIn;

out vec2 texCoords;

void main(){
	texCoords = (posIn+vec2(1.0, 1.0))/2.0;
	gl_Position = vec4(posIn, 0.0, 1.0);
}
