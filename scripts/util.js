"use strict";

const fs = require("fs").promises;
const path = require("path");

/**
 * Loads all files in given folder if their name matches the provided regular expression
 * @param {string} folderPath path to folder containing the files
 * @param {RegExp} reg regular expression used to filter the files and retrieve the file number
 * @returns {Promise<string[]>} array of file contents
 */
const loadNumberedFiles = (folderPath, reg) => {

	return new Promise((resolve, reject) => {
		const filePromises = [];
		const contents = [];

		fs.readdir(folderPath).then((fileNames) => {
			for (const fileName of fileNames) {
				const match = reg.exec(fileName);

				if (match != null) {
					const num = Number.parseInt(match[1], 10) - 1; //numbers start from 1
					filePromises.push(
						fs.readFile(path.resolve(folderPath, fileName)).then((buf) => {
							contents[num] = buf.toString();
							return "done";
						})
					);
				}
			}

			Promise.all(filePromises).then(() => resolve(contents))
		});
	});
};

/**
* Generates a unique id for edge given ids of nodes it connects
* @param {number} a	node id
* @param {number} b node id
* @returns {number} generated edge id
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
 * @param {number[]} moments 
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

/**
 * Stringifies the graphin a specific wa and writes into provided file
 * @param {Object} graph graph to write
 * @param {string} path path to resulting file
 */
const writeToFile = (graph, path) => {

	//define JSON replacer
	const replacer = (key, value) => {
		if (value instanceof Array && typeof value[0] == "number") {
			return `[${value[0]}, ${value[1]}]`; // place interval arrays on the same line
		} else {
			return value;
		}
	};

	//JSON.stringify wraps interval arrays into "", remove them
	const jsonText = JSON.stringify(graph, replacer, "\t").replaceAll("\"[", "[").replaceAll("]\"", "]");
	fs.writeFile(path, jsonText);
};

module.exports = {
	getEdgeId,
	momentsToIntervals,
	loadNumberedFiles,
	writeToFile
};