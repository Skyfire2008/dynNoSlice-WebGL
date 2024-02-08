#version 300 es
#define IDEAL_DIST 0.5
precision highp float;

in vec2 texCoords;

out vec4 fragColor;

uniform sampler2D posTex;
uniform sampler2D intervalsTex;
uniform sampler2D adjacenciesTex;

/**
  * Gets repulsive force for given trajectory point and two edge points
*/
vec3 getRepulsiveForce(vec3 nodePos, vec3 edgePos0, vec3 edgePos1) {

	vec3 edgeVec = edgePos1 - edgePos0;
	vec3 nodeVec = nodePos - edgePos0;
	vec3 nodeProj = vec3(0.0f);

	//calculate projection multiplier
	float projMult = dot(nodeVec, edgeVec) / dot(edgeVec, edgeVec);
	if(projMult < 0.0f) { // if projection multiplier < 0, projection falls before edgePos0, use it as projection point
		nodeProj = edgePos0;
	} else if(projMult > 1.0f) { // if prokection multiplier > 1, projection falls after edgePos1, use
		nodeProj = edgePos1;
	} else { //otherwise calculate projection normally
		nodeProj = edgePos0 + projMult * edgeVec;
	}

	vec3 force = nodePos - nodeProj;

	//skip if node already too far from the edge
	if(length(force) > 5.0f * IDEAL_DIST) {
		return vec3(0.0f);
	} else {
		force = IDEAL_DIST * IDEAL_DIST * force / dot(force, force);

		//INFO: prevents points moving around in time
		//force.z = 0.0f;
		return force;
	}
}

/**
  * Calculates the min and max time that the point can take(in order to implement time correctness)
*/
vec2 getValidInterval(ivec2 pixelCoords, vec4 pos) {
	vec4 prev = texelFetch(posTex, pixelCoords - ivec2(1, 0), 0);
	vec4 next = texelFetch(posTex, pixelCoords + ivec2(1, 0), 0);

	//if point is final/first in trajectory or first in general, it cannot be moved in time 
	if(pos.a == 0.0f || prev.a == 0.0f || pixelCoords.x == 0) {
		return vec2(pos.z, pos.z);
	}

	//
	return vec2(mix(pos.z, prev.z, 0.1f), mix(pos.z, next.z, 0.1f));
}

void main() {

	ivec2 texSize = textureSize(posTex, 0);
	ivec2 pixelCoords = ivec2(gl_FragCoord);
	vec4 pos = texelFetch(posTex, pixelCoords, 0);

	//skip if position is outside of intervals
	bool skip = false;
	if(pos.a == 0.0f) {
		skip = texelFetch(posTex, pixelCoords - ivec2(1, 0), 0).a == 0.0f;
	}

	if(!skip) {
		vec3 totalForce = vec3(0.0f);

		//for every node trajectory...
		for(int id = 0; id < texSize.y; id++) {

			//if current pixel belongs to processed trajectory, skip
			if(id != pixelCoords.y) {

				//for every position in trajectory...
				for(int i = 0; i < texSize.x - 1; i++) {
					vec4 edgePos0 = texelFetch(posTex, ivec2(i, id), 0);

					//skip if this position is final in trajectory segment
					if(edgePos0.a == 0.0f) {
						continue;
					}

					vec4 edgePos1 = texelFetch(posTex, ivec2(i + 1, id), 0);
					totalForce += getRepulsiveForce(pos.xyz, edgePos0.xyz, edgePos1.xyz);
				}
			}
		}

		//update position
		vec2 interval = getValidInterval(pixelCoords, pos);
		pos.xyz += totalForce;

		//INFO: time correctness
		pos.z = max(interval.x, pos.z);
		pos.z = min(interval.y, pos.z);
	}

	//INFO: gravity
	pos.xy *= 0.99f;
	fragColor = pos;
}
