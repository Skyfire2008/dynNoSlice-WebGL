#version 300 es
precision highp float;

layout(location = 0) in vec3 colorIn;

uniform sampler2D posTex;
uniform lowp isampler2D presenceTex;
uniform int index;
uniform float mult;

out vec4 color;

void main(){
	int byteIndex = gl_VertexID/8;
	int byte = texelFetch(presenceTex, ivec2(byteIndex, index), 0).r;
	int present = (byte >> (gl_VertexID-byteIndex*8)) & 1;

	vec2 texPos0 = texelFetch(posTex, ivec2(gl_VertexID, index), 0).rg;
	vec2 texPos1 = texelFetch(posTex, ivec2(gl_VertexID, index+1), 0).rg;
	gl_Position = vec4(mix(texPos0, texPos1, mult), 0.0, 1.0);
	color = vec4(colorIn*float(present), 1.0);
}