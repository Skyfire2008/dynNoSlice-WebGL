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

uniform sampler2D posTex;

out vec4 color;

void main(){
	vec2 texPos = texelFetch(posTex, ivec2(gl_VertexID, 0), 0).rg;
	float diff = distance(texPos, posIn);
	gl_Position = vec4(texPos, 0.0, 1.0);
	color = vec4(diff, 0.0, 0.0, 1.0);
}`;
}