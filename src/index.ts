namespace dynnoslice {

	interface ViewModel {
		graphFile: KnockoutObservable<ui.File>;
	}

	let mainCanvas: HTMLCanvasElement;
	let ctx: WebGL2RenderingContext;
	let shader: graphics.Shader;
	let network: graph.Network;
	let shapes: Array<graphics.Shape> = [];
	let positionTexture: graphics.PositionTexture = null;

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

			//cleanup old GPU data
			for (const shape of shapes) {
				shape.dispose();
			}
			if (positionTexture != null) {
				positionTexture.dispose();
			}

			[shapes, positionTexture] = graph.toShapes(network);
			for (const shape of shapes) {
				shape.init();
			}
			positionTexture.init();

			shader.use();
			positionTexture.bind(graphics.gl.TEXTURE0);
			shader.setInt("posTex", 0);
			shader.drawShape(shapes[0]);
		});

		ko.applyBindings(viewModel);
	});

}