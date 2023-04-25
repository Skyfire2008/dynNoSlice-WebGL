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

out vec4 color;

void main(){
	vec2 texPos = texelFetch(posTex, ivec2(gl_VertexID, 0), 0).rg;
	gl_Position = vec4(texPos, 0.0, 1.0);
	color = vec4(colorIn, 1.0);
}`;
	export const testFramebufferFrag = `#version 300 es
precision highp float;

in vec2 texCoords;

out vec2 fragColor;

uniform sampler2D posTex;

void main(){
	vec2 color = texture(posTex, texCoords).rg;
	fragColor = color*0.9;
}
`;
	export const testFramebufferVert = `#version 300 es
precision highp float;

layout(location = 0) in vec2 posIn;
layout(location = 1) in vec2 uvIn;

out vec2 texCoords;

void main(){
	texCoords = (posIn+vec2(1.0, 1.0))/2.0;
	gl_Position = vec4(posIn, 0.0, 1.0);
}
`;
}