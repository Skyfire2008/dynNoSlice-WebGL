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
}`;
	export const drawQuadFrag = `#version 300 es
precision highp float;

in vec2 texCoords;

out vec4 fragColor;

uniform sampler2D tex;

void main(){
	fragColor = texture(tex, texCoords);
}
`;
	export const drawQuadVert = `#version 300 es
precision highp float;

layout(location = 0) in vec2 posIn;
layout(location = 1) in vec2 uvIn;

out vec2 texCoords;

uniform sampler2D posTex;

void main(){
	texCoords = uvIn;
	gl_Position = vec4(posIn, 0.0, 1.0);
}
`;
	export const updatePositionsFrag = `#version 300 es
precision highp float;

in vec2 texCoords;

out vec4 fragColor;

uniform sampler2D posTex;

//TODO: this is a placeholder, implement it
void main(){
	fragColor = texture(posTex, texCoords).argb;
}
`;
}