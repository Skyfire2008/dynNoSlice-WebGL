namespace dynnoslice {

	interface ViewModel {
		graphFile: KnockoutObservable<ui.File>;
		step: () => void;
	}

	let mainCanvas: HTMLCanvasElement;
	let ctx: WebGL2RenderingContext;
	let shader: graphics.Shader;
	let network: graph.Network;
	let shapes: Array<graphics.Shape> = [];
	let positionTexture: graphics.PositionTexture = null;
	let temp: graphics.PositionTexture;

	let fb0: graphics.Framebuffer;
	let fb1: graphics.Framebuffer;
	let flip = true;

	window.addEventListener("load", () => {
		mainCanvas = <HTMLCanvasElement>document.getElementById("mainCanvas");
        ctx = mainCanvas.getContext("webgl2");
        const renderToFloatExt = ctx.getExtension("EXT_color_buffer_float");
        console.log(renderToFloatExt);
		ctx.clearColor(0.5, 0.5, 0.5, 1.0);

		graphics.Shader.init(ctx);
		shader = new graphics.Shader(shaders.drawGraphVert, shaders.drawGraphFrag);

		const foo = new graphics.Shader(shaders.testFramebufferVert, shaders.testFramebufferFrag);
		//foo.use();
		//foo.drawQuad(1280, 720);

		const viewModel: ViewModel = {
			graphFile: ko.observable(null),
            step: () => {
                graphics.Shader.clear();

				let boundFb = flip ? fb1 : fb0;
				let tex = flip ? positionTexture : temp;
				let srcTex = flip ? temp : positionTexture;

                boundFb.bind();
                graphics.Shader.clear();
				foo.use();
				tex.bind(graphics.gl.TEXTURE0);
				foo.setInt("posTex", 0);
				foo.drawQuad(positionTexture.width, positionTexture.height);
				graphics.gl.bindFramebuffer(graphics.gl.FRAMEBUFFER, null);

				graphics.gl.viewport(0, 0, 1280, 720);
				shader.use();
				srcTex.bind(graphics.gl.TEXTURE0);
				shader.setInt("posTex", 0);
				shader.drawShape(shapes[0]);

				foo.use();
				srcTex.bind(graphics.gl.TEXTURE0);
				foo.setInt("posTex", 0);
				foo.drawQuad(positionTexture.width, positionTexture.height);

				flip = !flip;
			}
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
			if (fb0 != null) {
				fb0.dispose();
			}
			if (fb1 != null) {
				fb1.dispose();
			}

			[shapes, positionTexture] = graph.toShapes(network);
			for (const shape of shapes) {
				shape.init();
			}
			positionTexture.init();
			fb0 = new graphics.Framebuffer(positionTexture.id, positionTexture.width, positionTexture.height);
			temp = new graphics.PositionTexture(positionTexture.width, positionTexture.height, new Float32Array(positionTexture.width * positionTexture.height * 2));
			temp.init();
			fb1 = new graphics.Framebuffer(temp.id, temp.width, temp.height);
			fb0.init();
			fb1.init();

			shader.use();
			positionTexture.bind(graphics.gl.TEXTURE0);
			shader.setInt("posTex", 0);
			shader.drawShape(shapes[0]);
		});

		ko.applyBindings(viewModel);
	});

}