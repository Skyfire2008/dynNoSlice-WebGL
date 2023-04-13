//This script generates a typescript file containing shader source code
//so that it wouldn't have to be fetched via XMLHttpRequest or embedded in the HTML page
//and variable names could be used for completion

const fs = require("fs");
const path = require("path");

const promises = [];
const shaderMap = new Map();

fs.promises.readdir("src/shaders").then((files) => {
	//read every file in the shaders directory
	for (const file of files) {
		promises.push(fs.promises.readFile(path.resolve("src", "shaders", file)).then((buf) => {
			console.log(`Read shader ${file}...`);
			const dotIndex = file.indexOf(".");
			return {
				//file name turns from sampleShader.vert to sampleShaderVert
				name: file.substring(0, dotIndex) + file.charAt(dotIndex + 1).toLocaleUpperCase() + file.substring(dotIndex + 2),
				content: buf.toString()
			};
		}));
	}

	let shaderString = "namespace shaders {\n";
	Promise.all(promises).then((results) => {
		//add every file contents to shaders.ts as a constant
		for (const { name, content } of results) {
			shaderString += `	export const ${name} = \`${content}\`;\n`
		}
		shaderString += "}";

		fs.promises.writeFile("src/shaders.ts", shaderString).then(() => {
			console.log("shaders.ts generated succesfully");
		});
	});
});
