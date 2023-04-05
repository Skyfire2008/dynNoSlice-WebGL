import "knockout";

let mainCanvas: HTMLCanvasElement;
let ctx: WebGL2RenderingContext;

window.addEventListener("load", () => {
	mainCanvas = <HTMLCanvasElement>document.getElementById("mainCanvas");
	ctx = mainCanvas.getContext("webgl2");
});