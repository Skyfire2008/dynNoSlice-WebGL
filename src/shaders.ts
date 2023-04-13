namespace shaders {
	export const drawGraphFrag = `#version 300 es
precision highp float;

in vec4 color;

out vec4 fragColor;

void main(){
	fragColor = color;
}`;
	export const drawGraphVert = `#version 300 es
precision highp float;

layout(location = 0) in vec3 colorIn;
layout(location = 1) in vec2 posIn;

out vec4 color;

void main(){
	gl_Position = vec4(posIn, 0.0, 1.0);
	color = vec4(colorIn, 1.0);
}`;
}