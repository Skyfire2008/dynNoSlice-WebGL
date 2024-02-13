#version 300 es
#define IDEAL_DIST 2.0
precision highp float;

in vec2 texCoords;

out vec4 fragColor;

uniform sampler2D posTex;
uniform sampler2D intervalsTex;
uniform mediump usampler2D adjacenciesTex;
uniform sampler2D newAdjTex;

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
	int maxPosNum = textureSize(posTex, 0).x;
	vec3 resultForce = vec3(0.0f);

	//get number of adjacencies
	int adjNum = int(texelFetch(newAdjTex, ivec2(0, pixelCoords.y), 0).r);

	//for every adjacency...
	for(int i = 0; i < adjNum; i++) {
		//get interval for this adjacency
		vec4 foo = texelFetch(newAdjTex, ivec2(i + 1, pixelCoords.y), 0);
		Interval curInterval = Interval(foo.y, foo.z);

		//if position outside of interval, skip
		if(pos.z < curInterval.t0 || pos.z > curInterval.t1) {
			continue;
		}

		//go through positions of adjacent node
		int adjNode = int(foo.r);
		vec4 prevAdjPos = texelFetch(posTex, ivec2(0, adjNode), 0);
		for(int j = 0; j < maxPosNum; j++) {

			vec4 adjPos = texelFetch(posTex, ivec2(j, adjNode), 0);

			//if adjacent node's previous position is after point, break
			if(prevAdjPos.z > pos.z) {
				break;
			}

			//if adjacent node's positions have ended, break
			if(adjPos.a == 0.0f && prevAdjPos.a == 0.0f) {
				break;
			}

			//if point exists within adjacent node's current segment, apply force
			if(prevAdjPos.z <= pos.z && pos.z <= adjPos.z) {

				//INFO: debug
				//return vec3(adjNode, j, 0.0f);

				vec4 otherPos = vec4(0.0f);
				if(adjPos.z - prevAdjPos.z > 0.0f) {
					otherPos = mix(prevAdjPos, adjPos, (pos.z - prevAdjPos.z) / (adjPos.z - prevAdjPos.z));
				} else {
					otherPos = adjPos;
				}

				//INFO: debug
				///return otherPos.xyz;

				vec3 force = otherPos.xyz - pos.xyz;
				force *= length(force) / IDEAL_DIST;

				resultForce += force;
				break;
			}

			prevAdjPos = adjPos;
		}
	}

	return resultForce;
}

/**
  * Calculates the min and max time that the point can take(in order to implement time correctness)
*/
Interval getValidInterval(ivec2 pixelCoords, vec4 pos) {
	vec4 prev = texelFetch(posTex, pixelCoords - ivec2(1, 0), 0);
	vec4 next = texelFetch(posTex, pixelCoords + ivec2(1, 0), 0);

	//INFO: debug
	//return Interval(pos.z, pos.z);

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
	if(pos.a == 0.0f) {
		if(texelFetch(posTex, pixelCoords - ivec2(1, 0), 0).a == 0.0f) {
			fragColor = pos;
			return;
		}
	}

	//INFO: debug
	//fragColor.rg = getAttractionForce(pixelCoords, pos).xy;
	//fragColor.ba = pos.ba;
	//return;

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
	totalForce += getAttractionForce(pixelCoords, pos) * 0.01f;

	//update position
	Interval interval = getValidInterval(pixelCoords, pos);

	//INFO: debug
	//float fLength = length(totalForce);
	//if(fLength > 10.0f) {
	//	totalForce *= 10.0f / fLength;
	//}

	pos.xyz += totalForce;

	//INFO: time correctness
	pos.z = max(interval.t0, pos.z);
	pos.z = min(interval.t1, pos.z);

	//INFO: gravity
	pos.xy *= 0.9f;
	fragColor = pos;
}
