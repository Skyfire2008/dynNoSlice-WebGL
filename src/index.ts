namespace dynnoslice {

	interface ViewModel {
		graphFile: KnockoutObservable<ui.File>;
		timestamps: KnockoutObservable<Array<number>>;
		step: () => void;
		onSliderChange: (value: ui.TimeSliderValue) => void;
		sliderValue: ui.TimeSliderValue;
	}

	let mainCanvas: HTMLCanvasElement;
	let ctx: WebGL2RenderingContext;
	let shader: graphics.Shader;
	let network: graph.Network;
	let shapes: Array<graphics.Shape> = [];
	let positionTexture: graphics.Texture = null;
	let presenceTexture: graphics.Texture = null;
	let temp: graphics.Texture;

	let fb0: graphics.Framebuffer;
	let fb1: graphics.Framebuffer;
	let flip = true;

	window.addEventListener("load", () => {

		const redraw = () => {
			shader.use();
			graphics.Shader.clear();
			let srcTex = flip ? temp : positionTexture;
			srcTex.bind(graphics.gl.TEXTURE0);
			shader.setInt("posTex", 0);
			shader.setInt("index", viewModel.sliderValue.index);
			shader.setFloat("mult", viewModel.sliderValue.mult);
			presenceTexture.bind(graphics.gl.TEXTURE1);
			shader.setInt("presenceTex", 1);
			shader.drawShape(shapes[viewModel.sliderValue.index]);
		};

		mainCanvas = <HTMLCanvasElement>document.getElementById("mainCanvas");
		ctx = mainCanvas.getContext("webgl2");
		const renderToFloatExt = ctx.getExtension("EXT_color_buffer_float");
		console.log(renderToFloatExt);
		ctx.clearColor(1.0, 1.0, 1.0, 1.0);

		graphics.Shader.init(ctx);
		shader = new graphics.Shader(shaders.drawGraphVert, shaders.drawGraphFrag);

		const foo = new graphics.Shader(shaders.testFramebufferVert, shaders.testFramebufferFrag);
		//foo.use();
		//foo.drawQuad(1280, 720);

		const viewModel: ViewModel = {
			graphFile: ko.observable(null),
			timestamps: ko.observable([]),
			step: () => {
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
				redraw();
				/*shader.use();
				srcTex.bind(graphics.gl.TEXTURE0);
				shader.setInt("posTex", 0);
				shader.drawShape(shapes[0]);*/

				/*foo.use();
				srcTex.bind(graphics.gl.TEXTURE0);
				foo.setInt("posTex", 0);
				foo.drawQuad(positionTexture.width, positionTexture.height);*/

				flip = !flip;
			},
			onSliderChange: (e) => {
				Object.assign(viewModel.sliderValue, e);
				redraw();
			},
			sliderValue: {
				time: 0,
				index: 0,
				mult: 0
			}
		};
		viewModel.graphFile.subscribe((file) => {
			network = JSON.parse(file.contents);

			viewModel.timestamps(network.layers.map((layer) => layer.timestamp));

			//cleanup old GPU data
			for (const shape of shapes) {
				shape.dispose();
			}
			if (positionTexture != null) {
				positionTexture.dispose();
			}
			if (presenceTexture != null) {
				presenceTexture.dispose();
			}
			if (fb0 != null) {
				fb0.dispose();
			}
			if (fb1 != null) {
				fb1.dispose();
			}

			[shapes, positionTexture, presenceTexture] = graph.toShapes(network);

			fb0 = new graphics.Framebuffer(positionTexture.id, positionTexture.width, positionTexture.height);
			temp = graphics.Texture.makePositionTexture(positionTexture.width, positionTexture.height, new Float32Array(positionTexture.width * positionTexture.height * 2));
			fb1 = new graphics.Framebuffer(temp.id, temp.width, temp.height);
			flip = true;

			shader.use();
			positionTexture.bind(graphics.gl.TEXTURE0);
			shader.setInt("posTex", 0);
			shader.drawShape(shapes[0]);
		});

		ko.applyBindings(viewModel);
	});

}