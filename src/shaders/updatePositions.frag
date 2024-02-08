#version 300 es
#define IDEAL_DIST 1.0
precision highp float;

in vec2 texCoords;

out vec4 fragColor;

uniform sampler2D posTex;
uniform sampler2D intervalsTex;
uniform sampler2D adjacenciesTex;

/**
  * Gets repulsive force for given trajectory point and two edge points
*/
vec3 getRepulsiveForce(vec3 nodePos, vec3 edgePos0, vec3 edgePos1){

	vec3 edgeVec = edgePos1 - edgePos0;
	vec3 nodeVec = nodePos - edgePos0;
	vec3 nodeProj = vec3(0.0);

	//calculate projection multiplier
	float projMult = dot(nodeVec, edgeVec) / dot(edgeVec, edgeVec);
	if(projMult < 0.0){ // if projection multiplier < 0, projection falls before edgePos0, use it as projection point
		nodeProj = edgePos0;
	}else if(projMult > 1.0){ // if prokection multiplier > 1, projection falls after edgePos1, use
		nodeProj = edgePos1;
	}else{ //otherwise calculate projection normally
		nodeProj = edgePos0 + projMult * edgeVec;
	}
	
	vec3 force = nodePos - nodeProj;

	//skip if node already too far from the edge
	if(length(force) > 5.0*IDEAL_DIST){
		return vec3(0.0);
	}else{
		force = IDEAL_DIST * IDEAL_DIST * force / dot(force, force);

		//INFO: prevents points moving around in time
		force.z = 0.0;
		return force;
	}
}

void main(){

	ivec2 texSize = textureSize(posTex, 0);

	//TODO: rewrite this, utilizing the alpha channel
	//skip if position is outside of intervals (time is lower or equal to previous position)
	ivec2 pixelCoords = ivec2(gl_FragCoord);
	vec4 pos = texelFetch(posTex, pixelCoords, 0);
	float timeDiff = 0.0;
	if(pixelCoords.x == 0){
		timeDiff = texelFetch(posTex, pixelCoords + ivec2(1, 0), 0).b - pos.b;
	}else{
		timeDiff = pos.b - texelFetch(posTex, pixelCoords - ivec2(1, 0), 0).b;
	}

	vec3 totalForce = vec3(0.0);
	float count = 0.0;

	if(timeDiff > 0.0){
		//for every node trajectory...
		for(int id=0; id<texSize.y; id++){

			//if current pixel belongs to processed trajectory, skip
			if(id != pixelCoords.y){

				//for every position in trajectory...
				for(int i=0; i<texSize.x-1; i++){
					vec4 edgePos0 = texelFetch(posTex, ivec2(i, id), 0);

					//skip if this position is final in trajectory segment
					if(edgePos0.a == 0.0){
						continue;
					}

					count++;
					vec4 edgePos1 = texelFetch(posTex, ivec2(i + 1, id), 0);
					totalForce += getRepulsiveForce(pos.xyz, edgePos0.xyz, edgePos1.xyz);
				}
			}
		}
	}

	pos.xyz += totalForce;
	//INFO: gravity
	pos.xy *=0.99;
	fragColor = pos;
}
