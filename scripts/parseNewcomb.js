"use strict";

const util = require("./util");

util.loadNumberedFiles("test data/newcomb", /newfrat([0-9]+).csv/).then((weeks) => {

	const nodes = []; //node array
	const edges = new Map(); // maps edge id to intermediate edge objects

	//get the student number by counting the number of preferences for first student on first week
	const studentNum = weeks[0].match(/(.)+[\r\n]+/)[0].trim().split(/\s+/).length;

	//every student is present every week, fill nodes
	for (let i = 0; i < studentNum; i++) {
		nodes.push({
			label: `student${i}`,
			intervals: [[0, weeks.length]]
		});
	}

	//parse every week data
	for (let weekNum = 0; weekNum < weeks.length; weekNum++) {
		const week = weeks[weekNum];
		const students = week.split(/[\r\n]+/); //split by newline to get individual student data

		for (let studentNum = 0; studentNum < students.length; studentNum++) {
			let studentData = students[studentNum];

			if (studentData.length == 0) { //final line is empty, skip it
				break;
			}

			//convert line of numbers into number array and sort it ascending
			studentData = studentData.trim();
			const preferences = studentData.split(/\s+/).map((value, index) => { return { student: index, rating: Number.parseInt(value) }; });
			preferences.sort((a, b) => a.rating - b.rating);

			//update edges between current student and three top-rated ones
			for (let i = 1; i <= 3; i++) {
				const preference = preferences[i];
				const edgeId = util.getEdgeId(studentNum, preference.student);

				let edge = edges.get(edgeId);
				if (edge == null) {
					edge = {
						from: studentNum,
						to: preference.student,
						id: edgeId,
						weeks: []
					};
					edges.set(edgeId, edge);
				}

				//it's possible that friendship is mutual, don't duplicate the week number
				if (edge.weeks[edge.weeks.length - 1] != weekNum) {
					edge.weeks.push(weekNum);
				}
			}
		}
	}

	//convert edge map to edge array
	const result = {
		nodes,
		edges: []
	};
	for (const edge of edges.values()) {
		result.edges.push({
			from: edge.from,
			to: edge.to,
			intervals: util.momentsToIntervals(edge.weeks)
		});
	}

	//stringify and save to file
	util.writeToFile(result, "test data/newcomb.json");
});