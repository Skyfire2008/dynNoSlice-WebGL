"use strict";

const fs = require("fs");

const promises = [
	fs.promises.copyFile("node_modules/knockout/build/output/knockout-latest.debug.js", "bin/knockout-latest.debug.js"),
	fs.promises.copyFile("src/index.html", "bin/index.html")
];

Promise.all(promises).then(() => {
	console.log("All files copied successfully");
});