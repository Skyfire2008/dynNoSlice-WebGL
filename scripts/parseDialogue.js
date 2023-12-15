"use strict";

//TODO: convert to typescript
const fs = require("fs").promises;
const path = require("path");

/*
interface IntermediateEdge{
	from: number;
	to: number;
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

		const nodes = new Map(); // string -> number
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
				const speakers = dialogue.split("\t");
				const speakerIds = [nodes.get(speakers[0]), nodes.get(speakers[1])];

				//add new nodes if necessary
				for (let i = 0; i < 2; i++) {
					if (speakerIds[i] == null) {
						speakerIds[i] = nodeNum++;
						nodes.set(speakers[i], speakerIds[i]);
					}
				}

				//add new edge if necessary
				const edgeId = getEdgeId(speakerIds[0], speakerIds[1]);
				let edge = edges.get(edgeId);
				if (edge == null) {
					edge = {
						from: speakerIds[0],
						to: speakerIds[1],
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
		for (const [node, nodeId] of nodes) {
			result.nodes[nodeId] = node;
		}

		//split edge into intervals
		for (const edge of edges.values()) {
			let prevChapter = edge.chapters[0];
			const intervals = [];
			for (let i = 1; i < edge.chapters.length; i++) {
				//if chapter numbers are not consecutive, the dialogue doesn't appear between them
				if (edge.chapters[i] != edge.chapters[i - 1] + 1) {
					intervals.push([prevChapter, edge.chapters[i - 1] + 1]);
					prevChapter = edge.chapters[i];
				}
			}

			result.edges.push({
				from: edge.from,
				to: edge.to,
				intervals
			});
		}

		//stringify and save to file
		fs.writeFile("test data/dialogues.json", JSON.stringify(result, undefined, "\t"));
	});
});