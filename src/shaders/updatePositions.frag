#version 300 es
precision highp float;

#define PI 3.1415926535897932384626433832795

in vec2 texCoords;

out vec4 fragColor;

uniform sampler2D posTex;
uniform sampler2D newAdjTex;

uniform float idealEdgeLength;
uniform bool timeChangeEnabled;
uniform bool repulsionEnabled;
uniform bool attractionEnabled;
uniform bool trajectoryStraighteningEnabled;
uniform bool gravityEnabled;
uniform bool mentalMapEnabled;

uniform float forceMultiplier;

struct Interval {
	float t0;
	float t1;
};

bool intervalsIntersect(Interval a, Interval b) {
	return a.t0 < b.t1 && b.t0 < a.t1;
}

Interval getIntervalIntersection(Interval a, Interval b) {
	return Interval(max(a.t0, b.t0), min(a.t1, b.t1));
}

float atan2(float y, float x) {
	//taken from https://stackoverflow.com/a/26070411
	bool s = abs(x) > abs(y);
	return mix(PI / 2.0f - atan(x, y), atan(y, x), s);
}

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
	/*if(length(force) > 5.0f * idealEdgeLength) {
		return vec3(0.0f);
	}*/

	force = idealEdgeLength * idealEdgeLength * force / dot(force, force);

	return force;
}

/*
	Gets the position of node at first or last point of time interval
*/
vec3 getPosInInterval(Interval interval, vec4 a, vec4 b, bool first) {
	float mult;

	if(first) {
		mult = (interval.t0 - a.z) / (b.z - a.z);
	} else {
		mult = (interval.t1 - a.z) / (b.z - a.z);
	}

	return mix(a, b, mult).xyz;
}

vec3 getNewAttractionForce(ivec2 pixelCoords, vec4 pos) {
	int maxPosNum = textureSize(posTex, 0).x;

	vec3 resultForce = vec3(0.0f);

	//get previous and next positions
	vec4 prevPos = texelFetch(posTex, pixelCoords - ivec2(1, 0), 0);
	bool hasPrev = pixelCoords.x > 0 && prevPos.a != 0.0f;
	Interval prevInterval;
	if(hasPrev) {
		prevInterval = Interval(prevPos.z, pos.z);
	}

	bool hasNext = pixelCoords.x < maxPosNum && pos.a != 0.0f;
	vec4 nextPos;
	Interval nextInterval;
	if(hasNext) {
		nextPos = texelFetch(posTex, pixelCoords + ivec2(1, 0), 0);
		nextInterval = Interval(pos.z, nextPos.z);
	}

	//get number of adjacencies
	int adjNum = int(texelFetch(newAdjTex, ivec2(0, pixelCoords.y), 0).r);

	//for every adjacency...
	for(int i = 0; i < adjNum; i++) {
		//get interval for this adjacency
		vec4 adjacency = texelFetch(newAdjTex, ivec2(i + 1, pixelCoords.y), 0);
		Interval curInterval = Interval(adjacency.y, adjacency.z);
		int adjNodeId = int(adjacency.x);

		//if adjacency's interval intersects with prev interval...
		if(hasPrev && intervalsIntersect(curInterval, prevInterval)) {

			Interval interval = getIntervalIntersection(curInterval, prevInterval);

			//go through positions of adjacent node
			vec4 prevAdjPos = vec4(0.0f, 0.0f, 0.0f, 0.0f);
			for(int i = 0; i < maxPosNum; i++) {
				vec4 adjPos = texelFetch(posTex, ivec2(i, adjNodeId), 0);

				//if adjacent node's positions have ended, stop
				if(adjPos.a == 0.0f && prevAdjPos.a == 0.0f) {
					break;
				}

				//if previous positions is an end, continue
				if(prevAdjPos.a == 0.0f) {
					prevAdjPos = adjPos;
					continue;
				}

				//if intervals doesn't intersect, skip
				Interval adjInterval = Interval(prevAdjPos.z, adjPos.z);
				if(!intervalsIntersect(adjInterval, interval)) {
					prevAdjPos = adjPos;
					continue;
				}

				//if all checks passed, calculate my and adjacent node's first positions in interval
				Interval intersection = getIntervalIntersection(adjInterval, interval);
				vec3 myPos = getPosInInterval(intersection, prevPos, pos, false);
				vec3 otherPos = getPosInInterval(intersection, prevAdjPos, adjPos, false);

				vec3 force = otherPos - myPos;

				//scale force according to the paper
				force *= length(force) / idealEdgeLength;
				float closenessMult = 1.0f - (prevInterval.t1 - intersection.t1) / (prevInterval.t1 - prevInterval.t0);
				float edgeRatio = (intersection.t1 - intersection.t0) / (prevInterval.t1 - prevInterval.t0);
				force *= closenessMult * edgeRatio;
				resultForce += force;

				prevAdjPos = adjPos;
			}
		}

		//if adjacnecy's interval intersects with next interval...
		if(hasNext && intervalsIntersect(curInterval, nextInterval)) {
			Interval interval = getIntervalIntersection(curInterval, nextInterval);

			//go through positions of adjacent node
			vec4 prevAdjPos = vec4(0.0f, 0.0f, 0.0f, 0.0f);
			for(int i = 0; i < maxPosNum; i++) {
				vec4 adjPos = texelFetch(posTex, ivec2(i, adjNodeId), 0);

				//if adjacent node's positions have ended, stop
				if(adjPos.a == 0.0f && prevAdjPos.a == 0.0f) {
					break;
				}

				//if previous positions is an end, continue
				if(prevAdjPos.a == 0.0f) {
					prevAdjPos = adjPos;
					continue;
				}

				//if intervals doesn't intersect, skip
				Interval adjInterval = Interval(prevAdjPos.z, adjPos.z);
				if(!intervalsIntersect(adjInterval, interval)) {
					prevAdjPos = adjPos;
					continue;
				}

				//if all checks passed, calculate my and adjacent node's first positions in interval
				Interval intersection = getIntervalIntersection(adjInterval, interval);
				vec3 myPos = getPosInInterval(intersection, pos, nextPos, true);
				vec3 otherPos = getPosInInterval(intersection, prevAdjPos, adjPos, true);

				vec3 force = otherPos - myPos;

				//scale force according to the paper
				force *= length(force) / idealEdgeLength;
				float closenessMult = 1.0f - (intersection.t0 - nextInterval.t0) / (nextInterval.t1 - nextInterval.t0);
				float edgeRatio = (intersection.t1 - intersection.t0) / (nextInterval.t1 - nextInterval.t0);
				force *= closenessMult * edgeRatio;
				resultForce += force;

				prevAdjPos = adjPos;
			}
		}
	}

	return resultForce;
}

vec3 getGravityForce(vec4 pos) {
	vec3 force = -0.9f * pos.xyz;
	force.z = 0.0f;
	return force;
}

vec3 getTrajectoryStraighteningForce(ivec2 pixelCoords, vec4 pos) {
	vec4 prev = texelFetch(posTex, pixelCoords - ivec2(1, 0), 0);
	vec4 next = texelFetch(posTex, pixelCoords + ivec2(1, 0), 0);
	vec3 center;

	//if node is last in segment
	if(pos.a == 0.0f) {
		center = (pos.xyz + prev.xyz) / 2.0f;
	} else if(prev.a == 0.0f) {
		//if node is first in segment
		center = (pos.xyz + next.xyz) / 2.0f;
	} else {
		center = (pos.xyz + next.xyz + prev.xyz) / 3.0f;
	}

	return center - pos.xyz;
}

vec3 getMentalMapForce(ivec2 pixelCoords, vec4 pos) {
	vec4 prev = texelFetch(posTex, pixelCoords - ivec2(1, 0), 0);
	vec4 next = texelFetch(posTex, pixelCoords + ivec2(1, 0), 0);

	vec3 force = vec3(0.0f);

	//if node is not last
	if(pos.a != 0.0f) {
		vec3 diff = (next - pos).xyz;
		float length = length(diff.xy);
		float angle = abs(atan2(length, diff.z));

		force += diff * angle / (PI / 2.0f - angle);
	}

	//if node is not first
	if(prev.a != 0.0f) {
		vec3 diff = (prev - pos).xyz;
		diff.z *= -1.0f; //time difference is negative after subtraction, make it positive again
		float length = length(diff.xy);
		float angle = abs(atan2(length, diff.z));

		force += diff * angle / (PI / 2.0f - angle);
	}

	force.z = 0.0f;

	return force;
}

/**
  * Calculates the min and max time that the point can take(in order to implement time correctness)
*/
Interval getValidInterval(ivec2 pixelCoords, vec4 pos) {

	if(!timeChangeEnabled) {
		return Interval(pos.z, pos.z);
	}

	vec4 prev = texelFetch(posTex, pixelCoords - ivec2(1, 0), 0);
	vec4 next = texelFetch(posTex, pixelCoords + ivec2(1, 0), 0);

	//if point is final/first in trajectory or first in general, it cannot be moved in time 
	if(pos.a == 0.0f || prev.a == 0.0f || pixelCoords.x == 0) {
		return Interval(pos.z, pos.z);
	}

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

	vec3 totalForce = vec3(0.0f);

	if(repulsionEnabled) {
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
					totalForce += 4.0f * getRepulsiveForce(pos.xyz, edgePos0.xyz, edgePos1.xyz);
				}
			}
		}
	}

	//add attraction force 
	if(attractionEnabled) {
		totalForce += 0.5f * getNewAttractionForce(pixelCoords, pos);
	}

	//add gravity
	if(gravityEnabled) {
		totalForce += 0.5f * getGravityForce(pos);
	}

	//add trajectory smoothing force
	if(trajectoryStraighteningEnabled) {
		totalForce += getTrajectoryStraighteningForce(pixelCoords, pos);
	}

	//add mental map preservation force
	if(mentalMapEnabled) {
		totalForce += 0.5f * getMentalMapForce(pixelCoords, pos);
	}

	Interval interval = getValidInterval(pixelCoords, pos);

	//scale the force
	totalForce *= 0.01f * forceMultiplier;

	//update position
	pos.xyz += totalForce;

	//time correctness
	pos.z = max(interval.t0, pos.z);
	pos.z = min(interval.t1, pos.z);

	//limit positions
	pos.xy = max(min(pos.xy, vec2(1280.0f, 720.0f)), vec2(-1280.0f, -720.0f));

	fragColor = pos;
}
