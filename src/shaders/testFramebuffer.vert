#version 300 es
precision highp float;

layout(location = 0) in vec2 posIn;
layout(location = 1) in vec2 uvIn;

out vec4 color;

void main(){
	color = vec4(uvIn, 1.0, 1.0);
	gl_Position = vec4(posIn, 0.0, 1.0);
}