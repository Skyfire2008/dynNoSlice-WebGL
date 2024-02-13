"use strict";

/**
* Generates a unique id for edge given ids of nodes it connects
* @param a	node id
* @param b node id
* @returns 
*/
const getEdgeId = (a, b) => {
	let min, max;
	if (a < b) {
		min = a;
		max = b;
	} else {
		min = b;
		max = a;
	}

	const triNum = max * (max + 1) / 2;
	return triNum + min;
};

/**
 * Converts an array of moments where a node/edge appears to array of intervals
 * @param moments 
 */
const momentsToIntervals = (moments) => {
	const intervals = [];

	let prevMoment = moments[0];
	for (let i = 1; i < moments.length; i++) {
		//if moment numbers are not consecutive, doesn't appear between them
		if (moments[i] != moments[i - 1] + 1) {
			intervals.push([prevMoment, moments[i - 1] + 1]);
			prevMoment = moments[i];
		}
	}

	//last interval was skipped, add it
	intervals.push([prevMoment, moments[moments.length - 1] + 1]);

	return intervals;
};

module.exports = {
	getEdgeId,
	momentsToIntervals
};