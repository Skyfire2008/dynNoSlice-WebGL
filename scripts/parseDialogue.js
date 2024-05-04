"use strict";

const util = require("./util");

//TODO: convert to typescript

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

//if mode is set to "keep nodes", nodes will no be removed from chapters where the character has no dialogue
const mode = "keepNodes";

util.loadNumberedFiles("test data/dialogues", /chapter_([0-9]+).txt/).then((chapters) => {

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
			const edgeId = util.getEdgeId(speakers[0].id, speakers[1].id);
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
	if (mode == "keepNodes") {
		for (const node of nodes.values()) {
			result.nodes[node.id] = {
				label: node.label,
				intervals: [[node.chapters[0], chapters.length]]
			};
		}
	} else {
		for (const node of nodes.values()) {
			result.nodes[node.id] = {
				label: node.label,
				intervals: util.momentsToIntervals(node.chapters)
			};
		}
	}

	//split edge into intervals
	for (const edge of edges.values()) {
		result.edges.push({
			from: edge.from,
			to: edge.to,
			intervals: util.momentsToIntervals(edge.chapters)
		});
	}

	//stringify and save to file
	util.writeToFile(result, `test data/dialogues-${mode != null ? mode : ""}.json`);
});