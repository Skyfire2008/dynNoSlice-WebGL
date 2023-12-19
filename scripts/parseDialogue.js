"use strict";

//TODO: convert to typescript
const fs = require("fs").promises;
const path = require("path");

/*
interface IntermediateEdge{
	from: number;
	to: number;
	chapters: Set<number>;
}
*/

/*
interface IntermediateNode{
	id: number;
	label: string;
	chapters: Array<number>;
}
*/

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
 * Converts an array of chapters where a dialogue/character appears to array of intervals
 * @param chapters 
 */
const chaptersToIntervals = (chapters) => {
	const intervals = [];

	let prevChapter = chapters[0];
	for (let i = 1; i < chapters.length; i++) {
		//if chapter numbers are not consecutive, doesn't appear between them
		if (chapters[i] != chapters[i - 1] + 1) {
			intervals.push([prevChapter, chapters[i - 1] + 1]);
			prevChapter = chapters[i];
		}
	}

	//last interval was skipped, add it
	intervals.push([prevChapter, chapters[chapters.length - 1] + 1]);

	return intervals;
};

fs.readdir("test data/dialogues").then((fileNames) => {
	const chapterPromises = [];
	const chapters = [];

	const reg = /chapter_([0-9]+).txt/;

	for (const fileName of fileNames) {
		//get chapter number
		const match = reg.exec(fileName);
		const num = Number.parseInt(match[1], 10) - 1; //chapters start from 1

		//read chapter
		chapterPromises.push(
			fs.readFile(path.resolve("test data/dialogues", fileName)).then((buf) => {
				chapters[num] = buf.toString();
				return "done";
			})
		);
	}

	Promise.all(chapterPromises).then(() => {

		const nodes = new Map(); // maps speaker names to speaker objects, string -> IntermediateNode
		let nodeNum = 0;
		const edges = new Map(); // number -> IntermediateEdge

		for (let chapterNum = 0; chapterNum < chapters.length; chapterNum++) {
			const chapter = chapters[chapterNum];

			//split chapter into separate dialogues
			const dialogues = chapter.split("\n");

			for (const dialogue of dialogues) {

				if (dialogue == "") {
					//skip last line of chapter, which is empty
					continue;
				}

				//separate speakers participating in the dialogue
				const speakerNames = dialogue.split("\t");
				const speakers = [nodes.get(speakerNames[0]), nodes.get(speakerNames[1])];

				for (let i = 0; i < 2; i++) {

					//if node doesn't exist, create it
					if (speakers[i] == null) {
						speakers[i] = {
							id: nodeNum++,
							label: speakerNames[i],
							chapters: [chapterNum]
						};
						nodes.set(speakerNames[i], speakers[i]);
					} else {
						//otherwise just update node's chapters
						if (speakers[i].chapters[speakers[i].chapters.length - 1] != chapterNum) {
							speakers[i].chapters.push(chapterNum);
						}
					}
				}

				//add new edge if necessary
				const edgeId = getEdgeId(speakers[0].id, speakers[1].id);
				let edge = edges.get(edgeId);
				if (edge == null) {
					edge = {
						from: speakers[0].id,
						to: speakers[1].id,
						chapters: []
					};
					edges.set(edgeId, edge);
				}

				//update edge chapters if necessary
				if (edge.chapters[edge.chapters.length - 1] != chapterNum) {
					edge.chapters.push(chapterNum);
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
				intervals: chaptersToIntervals(node.chapters)
			}
		}

		//split edge into intervals
		for (const edge of edges.values()) {
			result.edges.push({
				from: edge.from,
				to: edge.to,
				intervals: chaptersToIntervals(edge.chapters)
			});
		}

		//stringify and save to file
		function replacer(key, value) {
			if (value instanceof Array && typeof value[0] == "number") {
				return `[${value[0]}, ${value[1]}]`; // place interval arrays on the same line
			} else {
				return value;
			}
		}

		//JSON.stringify wraps interval arrays into "", remove them
		const jsonText = JSON.stringify(result, replacer, "\t").replaceAll("\"[", "[").replaceAll("]\"", "]");
		fs.writeFile("test data/dialogues.json", jsonText);
	});
});