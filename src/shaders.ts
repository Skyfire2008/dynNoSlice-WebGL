namespace dynnoslice {

	const shaderFiles = ["drawGraph.frag", "drawGraph.vert", "drawQuad.frag", "drawQuad.vert", "updatePositions.frag"];

	interface ShadersType {
		[inex: string]: string;
	}

	export const shaders: ShadersType = {};

	/**
	 * Resolves when all shaders load
	 */
	export const shadersLoadPromise = new Promise<void>((resolve, reject) => {
		const promises: Array<Promise<void>> = [];

		for (const file of shaderFiles) {
			promises.push(new Promise((resolve, reject) => {
				const path = `shaders/${file}`;
				const xhr = new XMLHttpRequest();
				xhr.addEventListener("load", (e) => {

					const dotIndex = file.indexOf(".");
					const name = file.substring(0, dotIndex) + file.charAt(dotIndex + 1).toLocaleUpperCase() + file.substring(dotIndex + 2);
					shaders[name] = xhr.responseText;

					resolve();
				});
				xhr.addEventListener("error", (e) => reject(`Could not fetch file ${path}`));
				xhr.open("GET", path);
				xhr.send();
			}));
		}

		Promise.all(promises).then(() => resolve());
	});
}