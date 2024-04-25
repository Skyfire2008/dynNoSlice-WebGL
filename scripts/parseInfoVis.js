"use strict";

const fs = require("fs").promises;
const util = require("./util");

fs.readFile("test data/infoVis.txt").then((buf) => {
	const contents = buf.toString();
	const nodes = new Map(); //author name -> author object
	const edges = new Map(); //edge id -> edge object

	//split the contents by empty lines
	const entries = contents.split(/\n\s*\n/);

	//for every entry except the first one (1995 2015)...
	for (let i = 1; i < entries.length; i++) {
		const current = entries[i];

		//if entry is empty, skip
		if (current == "") {
			continue;
		}

		//get the year
		const yearReg = /infovis(\d\d)/;
		let match = current.match(yearReg);
		let year = Number.parseInt(match[1]);
		if (year >= 95) {
			year += 1900;
		} else {
			year += 2000;
		}

		//get the authors
		const authors = [];
		const authorReg = /author:(.+)/g;
		for (let match of current.matchAll(authorReg)) {
			const authorName = match[1].trim();

			//fetch the node for author
			let node = nodes.get(authorName);
			if (node == null) {
				//create node if needed
				node = {
					label: authorName,
					id: nodes.size,
					years: []
				};
				nodes.set(authorName, node);
			}
			//update node's years
			if (!node.years.includes(year)) {
				node.years.push(year);
			}

			authors.push(node);
		}

		//skip the next step if paper has only one author
		if (authors.length < 2) {
			continue;
		}

		//for every pair of authors...
		for (let i = 0; i < authors.length; i++) {
			for (let j = i + 1; j < authors.length; j++) {
				const author0 = authors[i];
				const author1 = authors[j];

				//get edge
				const edgeId = util.getEdgeId(author0.id, author1.id);
				let edge = edges.get[edgeId];
				if (edge == null) {
					edge = {
						from: author0.id,
						to: author1.id,
						years: []
					};
					edges.set(edgeId, edge);
				}

				//update edge's years
				if (!edge.years.includes(year)) {
					edge.years.push(year);
				}
			}
		}
	}

	const result = {
		nodes: [],
		edges: []
	};

	//convert maps to arrays
	for (const node of nodes.values()) {
		result.nodes[node.id] = {
			label: node.label,
			intervals: util.momentsToIntervals(node.years)
		}
	}

	//split edge into intervals
	for (const edge of edges.values()) {
		result.edges.push({
			from: edge.from,
			to: edge.to,
			intervals: util.momentsToIntervals(edge.years)
		});
	}

	//stringify and save to file
	util.writeToFile(result, "test data/infoVis.json");
});