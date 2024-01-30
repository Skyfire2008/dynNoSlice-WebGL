namespace dynnoslice {

	interface ViewModel {
		graphFile: KnockoutObservable<ui.File>;
		timestamps: KnockoutObservable<Array<number>>;
		step: () => void;
		onSliderChange: (value: ui.TimeSliderValue) => void;
		sliderValue: ui.TimeSliderValue;
	}

	let mainCanvas: HTMLCanvasElement;


	let network: graph.ExtNetwork;

	let glCanvas: HTMLCanvasElement;
	let ctx: WebGL2RenderingContext;
	let posShader: graphics.Shader; //updates trajectories
	let quadShader: graphics.Shader; //draws a textured quad
	let intervalsTexture: graphics.Texture = null;
	let adjacenciesTexture: graphics.Texture = null;

	let positionTextures: [graphics.Texture, graphics.Texture] = [null, null];
	let positionFbs: [graphics.Framebuffer, graphics.Framebuffer] = [null, null];
	let pingPongIndex = 0; //source

	window.addEventListener("load", () => {

		/**
		 * Redraw the graph visualization
		 */
		const redraw = () => {
		};

		//setup gl context
		glCanvas = <HTMLCanvasElement>document.getElementById("glCanvas");
		ctx = glCanvas.getContext("webgl2");
		const renderToFloatExt = ctx.getExtension("EXT_color_buffer_float");
		console.log(renderToFloatExt);
		ctx.clearColor(1.0, 1.0, 1.0, 1.0);

		graphics.Shader.init(ctx);
		posShader = new graphics.Shader(shaders.drawQuadVert, shaders.updatePositionsFrag);
		quadShader = new graphics.Shader(shaders.drawQuadVert, shaders.drawQuadFrag);
		quadShader.use();

		const viewModel: ViewModel = {
			graphFile: ko.observable(null),
			timestamps: ko.observable([]),
			step: () => {
				//use ping pong index to et correct framebuffer and texture
				let boundFb = positionFbs[1 - pingPongIndex];
				let tex = positionTextures[pingPongIndex];

				//render into framebuffer
				boundFb.bind();
				graphics.Shader.clear();
				posShader.use();
				tex.bind(graphics.gl.TEXTURE0);
				posShader.setInt("posTex", 0);
				posShader.drawQuad();
				pingPongIndex = 1 - pingPongIndex;

				//readPixels to get update positions texture
				const buf = new Float32Array(tex.width * tex.height * 4);
				graphics.Shader.readPixels(tex.width, tex.height, buf);
				console.log(buf);

				//draw the resulting texture
				graphics.Shader.unbindFramebuffer();
				tex = positionTextures[pingPongIndex];
				graphics.Shader.clear();
				quadShader.use();
				tex.bind(graphics.gl.TEXTURE0);
				quadShader.setInt("posTex", 0);
				quadShader.drawQuad();
			},
			onSliderChange: (e) => {
				//Object.assign(viewModel.sliderValue, e);
				//redraw();
			},
			sliderValue: {
				time: 0,
				index: 0,
				mult: 0
			}
		};
		viewModel.graphFile.subscribe((file) => {
			network = new graph.ExtNetwork(JSON.parse(file.contents));

			//put network buffers into textures
			const [posBuf, posDims] = network.genPositionsBuffer(1);
			const [intervalsBuf, edgeMap] = network.genIntervalsBuffer();
			const [adjacencyBuf, adjDims] = network.genAdjacenciesBuffer(edgeMap);

			//cleanup old GPU data
			for (let i = 0; i < 2; i++) {
				if (positionTextures[i] != null) {
					positionTextures[i].dispose();
				}
				if (positionFbs[i] != null) {
					positionFbs[i].dispose();
				}
			}
			if (intervalsTexture != null) {
				intervalsTexture.dispose();
			}
			if (adjacenciesTexture != null) {
				adjacenciesTexture.dispose();
			}

			//create new textures and framebuffers
			positionTextures[0] = graphics.Texture.makePositionTexture(posDims.width, posDims.height, posBuf);
			positionTextures[1] = graphics.Texture.makePositionTexture(posDims.width, posDims.height, new Float32Array(4 * posDims.width * posDims.height));
			intervalsTexture = graphics.Texture.makeIntervalsTexture(1, intervalsBuf.length / 2, intervalsBuf);
			adjacenciesTexture = graphics.Texture.makeAdjacenciesTexture(adjDims.width, adjDims.height, adjacencyBuf);
			for (let i = 0; i < 2; i++) {
				positionFbs[i] = new graphics.Framebuffer(positionTextures[i].id, posDims.width, posDims.height);
			}
			pingPongIndex = 0;

			//change glCanvas dimensions to positions texture width and height
			glCanvas.width = posDims.width;
			glCanvas.height = posDims.height;
			graphics.Shader.setViewportDims(posDims.width, posDims.height);
		});

		ko.applyBindings(viewModel);
	});

}