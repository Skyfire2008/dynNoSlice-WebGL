"use strict";

const fs = require("fs");

const promises = [
	fs.promises.copyFile("node_modules/react/umd/react.production.min.js", "bin/react.production.min.js"),
	fs.promises.copyFile("node_modules/react-dom/umd/react-dom.production.min.js", "bin/react-dom.production.min.js"),
	fs.promises.copyFile("src/index.html", "bin/index.html")
];

Promise.all(promises).then(() => {
	console.log("All files copied successfully");
});