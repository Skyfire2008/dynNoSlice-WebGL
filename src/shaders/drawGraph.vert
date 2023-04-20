#version 300 es
precision highp float;

layout(location = 0) in vec3 colorIn;

uniform sampler2D posTex;

out vec4 color;

void main(){
	vec2 texPos = texelFetch(posTex, ivec2(gl_VertexID, 0), 0).rg;
	gl_Position = vec4(texPos, 0.0, 1.0);
	color = vec4(colorIn, 1.0);
}