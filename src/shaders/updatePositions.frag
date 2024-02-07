#version 300 es
precision highp float;

in vec2 texCoords;

out vec4 fragColor;

uniform sampler2D posTex;
uniform sampler2D intervalsTex;
uniform sampler2D adjacenciesTex;

void main(){

	ivec2 texSize = textureSize(posTex, 0);

	//skip if position is outside of intervals (time is lower or equal to previous position)
	ivec2 pixelCoords = ivec2(gl_FragCoord);
	vec4 pos = texelFetch(posTex, pixelCoords, 0);
	float timeDiff = 0.0;
	if(pixelCoords.x == 0){
		timeDiff = texelFetch(posTex, pixelCoords + ivec2(1, 0), 0).b - pos.b;
	}else{
		timeDiff = pos.b - texelFetch(posTex, pixelCoords - ivec2(1, 0), 0).b;
	}

	if(timeDiff > 0.0){
		for(int id=0; id<texSize.y; id++){
			if(id != pixelCoords.y){
				pos.r +=0.001;
			}
		}
	}

	fragColor = pos;
}
