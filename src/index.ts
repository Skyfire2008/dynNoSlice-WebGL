namespace dynnoslice {

	interface ViewModel {
		graphFile: KnockoutObservable<ui.File>;
	}

	let mainCanvas: HTMLCanvasElement;
	let ctx: WebGL2RenderingContext;
	let shader: graphics.Shader;
	let network: graph.Network;
	let shapes: Array<graphics.Shape> = [];

	window.addEventListener("load", () => {
		mainCanvas = <HTMLCanvasElement>document.getElementById("mainCanvas");
		ctx = mainCanvas.getContext("webgl2");

		graphics.Shader.init(ctx);
		shader = new graphics.Shader(shaders.drawGraphVert, shaders.drawGraphFrag);

		const viewModel: ViewModel = {
			graphFile: ko.observable(null)
		};
		viewModel.graphFile.subscribe((file) => {
			network = JSON.parse(file.contents);
			for (const shape of shapes) {
				shape.dispose();
			}
			shapes = graph.toShapes(network);
			for (const shape of shapes) {
				shape.init();
			}

			shader.use();
			shader.drawShape(shapes[0]);
		});

		ko.applyBindings(viewModel);
	});

}