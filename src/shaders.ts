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
uniform int index;
uniform float mult;

out vec4 color;

void main(){
	vec2 texPos0 = texelFetch(posTex, ivec2(gl_VertexID, index), 0).rg;
	vec2 texPos1 = texelFetch(posTex, ivec2(gl_VertexID, index+1), 0).rg;
	gl_Position = vec4(mix(texPos0, texPos1, mult), 0.0, 1.0);
	color = vec4(colorIn, 1.0);
}`;
	export const testFramebufferFrag = `#version 300 es
precision highp float;

in vec2 texCoords;

out vec2 fragColor;

uniform sampler2D posTex;

void main(){
	vec2 disp = vec2(0.0, 1.0/float(textureSize(posTex, 0).y));
	vec2 pos = texture(posTex, texCoords).rg;
	
	vec2 centre = (pos + texture(posTex, texCoords+disp).rg + texture(posTex, texCoords-disp).rg)/3.0;

	fragColor = mix(pos, centre, 0.5);
}
`;
	export const testFramebufferVert = `#version 300 es
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
}