#version 300 es
precision highp float;

layout(location = 0) in vec3 colorIn;

uniform sampler2D posTex;
uniform int index;
uniform float mult;

out vec4 color;

void main(){
	vec2 texPos0 = texelFetch(posTex, ivec2(gl_VertexID, index), 0).rg;
	vec2 texPos1 = texelFetch(posTex, ivec2(gl_VertexID, index+1), 0).rg;
	gl_Position = vec4(mix(texPos0, texPos1, mult), 0.0, 1.0);
	color = vec4(colorIn, 1.0);
}