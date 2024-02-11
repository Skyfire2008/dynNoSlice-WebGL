#version 300 es
#define IDEAL_DIST 1.0
precision highp float;

in vec2 texCoords;

out vec4 fragColor;

uniform sampler2D posTex;
uniform sampler2D intervalsTex;
uniform mediump usampler2D adjacenciesTex;

struct Interval {
	float t0;
	float t1;
};

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
	} else if(projMult > 1.0f) { // if projection multiplier > 1, projection falls after edgePos1, use
		nodeProj = edgePos1;
	} else { //otherwise calculate projection normally
		nodeProj = edgePos0 + projMult * edgeVec;
	}

	vec3 force = nodePos - nodeProj;

	//skip if node already too far from the edge
	/*if(length(force) > 5.0f * IDEAL_DIST) {
		return vec3(0.0f);
	}*/
	force = IDEAL_DIST * IDEAL_DIST * force / dot(force, force);

	return force;
}

vec3 getAttractionForce(ivec2 pixelCoords, vec4 pos) {

	vec3 resultForce = vec3(0.0f);

	//get number of adjacent nodes
	uint adjNum = texelFetch(adjacenciesTex, ivec2(0, pixelCoords.y), 0).r;

	//for every adjacency...
	for(uint i = 0u; i < adjNum; i++) {
		uvec4 adjacency = texelFetch(adjacenciesTex, ivec2(i + 1u, pixelCoords.y), 0);
		uint adjNodeId = adjacency.r;
		uint adjIntervalId = adjacency.g;

		//fetch the appropriate interval

		vec4 interval = texelFetch(intervalsTex, ivec2(0, adjIntervalId), 0);
		float t0 = interval.r;
		float t1 = interval.g;

		//if point lies inside the interval...
		if(pos.z >= t0 && pos.z < interval.y) {

			ivec2 posSize = textureSize(posTex, 0);

			//go through points of adjacent node to find the right ones
			for(int j = 0; j < posSize.x; j++) {
				vec4 adjPos = texelFetch(posTex, ivec2(j, adjNodeId), 0);

				if(adjPos.z < t0) {
					continue;
				} else if(adjPos.z > t1) {
					//should not happen
					break;
				} else {
					vec4 nextAdjPos = texelFetch(posTex, ivec2(j + 1, adjNodeId), 0);

					if(adjPos.z <= pos.z && pos.z <= nextAdjPos.z) {
						vec4 otherPos = vec4(0.0f);
						if(nextAdjPos.z - adjPos.z > 0.0f) {
							otherPos = mix(adjPos, nextAdjPos, (pos.z - adjPos.z) / (nextAdjPos.z - adjPos.z));
						} else {
							otherPos = adjPos;
						}

						vec3 force = otherPos.xyz - pos.xyz;
						force *= length(force) / IDEAL_DIST;
						resultForce += force;
						break;
					}
				}
			}
		}
	}

	resultForce.z = 0.0f;
	return resultForce;
}

/**
  * Calculates the min and max time that the point can take(in order to implement time correctness)
*/
Interval getValidInterval(ivec2 pixelCoords, vec4 pos) {
	vec4 prev = texelFetch(posTex, pixelCoords - ivec2(1, 0), 0);
	vec4 next = texelFetch(posTex, pixelCoords + ivec2(1, 0), 0);

	//if point is final/first in trajectory or first in general, it cannot be moved in time 
	if(pos.a == 0.0f || prev.a == 0.0f || pixelCoords.x == 0) {
		return Interval(pos.z, pos.z);
	}

	//
	return Interval(mix(pos.z, prev.z, 0.1f), mix(pos.z, next.z, 0.1f));
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

		//add attraction force 
		//totalForce += getAttractionForce(pixelCoords, pos) / 100.0f;

		//update position
		Interval interval = getValidInterval(pixelCoords, pos);
		pos.xyz += totalForce;

		//INFO: time correctness
		pos.z = max(interval.t0, pos.z);
		pos.z = min(interval.t1, pos.z);
	}

	//INFO: gravity
	pos.xy *= 0.99f;
	fragColor = pos;
}
