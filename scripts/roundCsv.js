"use strict";

const fs = require("fs").promises;

const path = process.argv[2];

if (path == null) {
	console.error("no path to csv file");
	process.exit(1);
}

fs.readFile(path).then((buf) => {
	const file = buf.toString();
	const lines = file.split("\n");
	for (const line of lines) {
		const words = line.split(",");
		for (const word of words) {
			const num = Number.parseFloat(word);
			if (!isNaN(num)) {
				process.stdout.write(`${Math.round(num * 1000) / 1000}`);
			} else {
				process.stdout.write(word);
			}

			process.stdout.write(",");
		}
		process.stdout.write("\n");
	}
});