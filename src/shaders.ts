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
	vec2 disp = vec2(1.0/float(textureSize(posTex, 0).x), 0);
	vec2 color = texture(posTex, texCoords).rg;
	color *= 14.0;
	color += texture(posTex, texCoords+disp).rg + texture(posTex, texCoords-disp).rg;
	color /= 16.0;
	vec2 normalized = normalize(color);
	fragColor = (3.0*color + normalized)/4.0;
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