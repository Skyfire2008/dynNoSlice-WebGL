"use strict";

const fs = require("fs").promises;
const util = require("./util");

//if mode is set to "days", tweets are aggregated over days
const mode = "days";

fs.readFile("test data/rugby.csv").then((buf) => {
	const contents = buf.toString();
	const nodes = new Map(); //team -> team object
	const edges = new Map(); //edge id -> edge object
	let startTime = Number.POSITIVE_INFINITY;
	let endTime = Number.NEGATIVE_INFINITY;

	const entries = contents.split("\n");

	//for every entry...
	for (let i = 1; i < entries.length; i++) {
		const entry = entries[i];

		const rugbyReg = /(.+),(.+),(.+)/g;
		for (const match of entry.matchAll(rugbyReg)) {
			let timestamp = Date.parse(match[1]) / 1000; //time is in milliseconds, so don't forget to divide by 1000

			//is mode is days, convert to days
			if (mode == "days") {
				timestamp = Math.floor(timestamp / (24 * 3600));
			}

			//update overall start and end time
			startTime = Math.min(startTime, timestamp);
			endTime = Math.max(endTime, timestamp);

			//get node0
			const teamName0 = match[3];
			let node0 = nodes.get(teamName0);
			if (node0 == null) {
				node0 = {
					label: teamName0,
					id: nodes.size
				};
				nodes.set(teamName0, node0);
			}

			//get node1
			const teamName1 = match[2];
			let node1 = nodes.get(teamName1);
			if (node1 == null) {
				node1 = {
					label: teamName1,
					id: nodes.size
				};
				nodes.set(teamName1, node1);
			}

			//get edge
			const edgeId = util.getEdgeId(node0.id, node1.id);
			let edge = edges.get(edgeId);
			if (edge == null) {
				edge = {
					from: node0.id,
					to: node1.id,
					intervals: []
				};

				if (mode == "days") {
					edge.days = [];
				}

				edges.set(edgeId, edge);
			}

			//update edge
			if (mode == "days") {
				if (!edge.days.includes(timestamp)) {
					edge.days.push(timestamp);
				}
			} else {
				edge.intervals.push([timestamp, timestamp + 1]);
			}
		}
	}

	//set interval for every team
	for (const node of nodes.values()) {
		node.intervals = [[startTime, endTime + 1]];
	}

	//output the data
	const result = {
		nodes: [],
		edges: []
	};

	//convert maps to arrays
	for (const node of nodes.values()) {
		result.nodes[node.id] = node;
	}

	if (mode == "days") {
		for (const edge of edges.values()) {
			result.edges.push({
				from: edge.from,
				to: edge.to,
				intervals: util.momentsToIntervals(edge.days)
			});
		}
	} else {
		for (const edge of edges.values()) {
			result.edges.push(edge);
		}
	}

	//stringify and save to file
	util.writeToFile(result, `test data/rugby${mode == "days" ? "-days" : ""}.json`);
});