namespace worker {

	/**
	 * Fetches a shader file using AJAX
	 * @param file file name
	 * @returns promise that resolves shader source code
	 */
	const fetchShader = (file: string) => {
		return new Promise<string>((resolve, reject) => {
			const path = `../shaders/${file}`;
			const xhr = new XMLHttpRequest();
			xhr.addEventListener("load", (e) => {
				resolve(xhr.responseText);
			});
			xhr.addEventListener("error", (e) => reject(`Could not fetch file ${path}`));
			xhr.open("GET", path);
			xhr.send();
		});
	};

	/**
	 * Performs a single step of DynNoSlice
	 * @param forceMultiplier scales the force before applying it to node position
	 */
	const step = (forceMultiplier: number) => {
		//use ping pong index to get correct framebuffer and texture
		let boundFb = positionFbs[1 - pingPongIndex];
		let tex = positionTextures[pingPongIndex];

		//render into framebuffer
		boundFb.bind();
		graphics.Shader.clear();
		posShader.use();

		tex.bind(graphics.gl.TEXTURE0);
		posShader.setInt("posTex", 0);
		newAdjTexture.bind(graphics.gl.TEXTURE1);
		posShader.setInt("newAdjTex", 1);

		//set settings
		posShader.setBool("timeChangeEnabled", settings.timeChangeEnabled);
		posShader.setFloat("idealEdgeLength", settings.idealEdgeLength);
		posShader.setFloat("forceMultiplier", forceMultiplier);
		posShader.setBool("repulsionEnabled", settings.repulsionEnabled);
		posShader.setBool("attractionEnabled", settings.attractionEnabled);
		posShader.setBool("trajectoryStraighteningEnabled", settings.trajectoryStraighteningEnabled);
		posShader.setBool("gravityEnabled", settings.gravityEnabled);
		posShader.setBool("mentalMapEnabled", settings.mentalMapEnabled);

		posShader.drawQuad();

		pingPongIndex = 1 - pingPongIndex;

		//readPixels to get update positions texture
		graphics.Shader.readPixels(tex.width, tex.height, posBuf);

		//draw the resulting texture
		graphics.Shader.unbindFramebuffer();
		tex = positionTextures[pingPongIndex];
		graphics.Shader.clear();
		quadShader.use();
		tex.bind(graphics.gl.TEXTURE0);
		quadShader.setInt("posTex", 0);
		quadShader.drawQuad();
	};

	const ctx: Worker = <any>self;
	const canvas = new OffscreenCanvas(1, 1);

	let drawQuadVert: string = null;
	let drawQuadFrag: string = null;
	let updatePositionsFrag: string = null;

	let posShader: graphics.Shader;
	let quadShader: graphics.Shader;
	let posBuf: Float32Array;
	let posDims: math.Dims;
	let newAdjTexture: graphics.Texture;
	let positionTextures: [graphics.Texture, graphics.Texture] = [null, null];
	let positionFbs: [graphics.Framebuffer, graphics.Framebuffer] = [null, null];
	let pingPongIndex = 0;

	let settings: dynnoslice.ui.Settings = null;
	let network: dynnoslice.ExtNetwork = null;

	let iterations = 0;

	ctx.onmessage = (ev: MessageEvent<Message>) => {
		switch (ev.data.type) {
			case (MessageType.InitialSetup): {
				//set settings
				settings = ev.data.payload;

				//setup webgl
				const gl = canvas.getContext("webgl2");
				const renderToFloatExt = gl.getExtension("EXT_color_buffer_float");
				console.log(renderToFloatExt);
				gl.clearColor(1.0, 1.0, 1.0, 1.0);
				graphics.Shader.init(gl);

				//request shader source code
				const promises: Array<Promise<void>> = [
					fetchShader("drawQuad.frag").then((src) => { drawQuadFrag = src; }),
					fetchShader("drawQuad.vert").then((src) => { drawQuadVert = src; }),
					fetchShader("updatePositions.frag").then((src) => { updatePositionsFrag = src; })
				];

				//once shader source code is loaded, send it to GPU
				Promise.all(promises).then(() => {
					posShader = new graphics.Shader(drawQuadVert, updatePositionsFrag);
					quadShader = new graphics.Shader(drawQuadVert, drawQuadFrag);
					quadShader.use();

					ctx.postMessage({ type: MessageType.InitialSetupDone });
				});
				break;
			}

			case (MessageType.Input): {
				//need to create local network object, since class instances cannot be passed by message
				network = new dynnoslice.ExtNetwork(ev.data.payload);

				//put network buffers into textures
				[posBuf, posDims] = network.genPositionsBuffer(settings.bendsEnabled ? settings.bendInterval : Number.POSITIVE_INFINITY, true);
				const [newAdjBuf, newAdjDims] = network.genNewAdjacenciesBuffer();

				//cleanup old GPU data
				for (let i = 0; i < 2; i++) {
					if (positionTextures[i] != null) {
						positionTextures[i].dispose();
					}
					if (positionFbs[i] != null) {
						positionFbs[i].dispose();
					}
				}
				if (newAdjTexture != null) {
					newAdjTexture.dispose();
				}

				//create new textures and framebuffers
				positionTextures[0] = graphics.Texture.makePositionTexture(posDims.width, posDims.height, posBuf);
				positionTextures[1] = graphics.Texture.makePositionTexture(posDims.width, posDims.height, new Float32Array(4 * posDims.width * posDims.height));
				newAdjTexture = graphics.Texture.makeNewAdjTexture(newAdjDims.width, newAdjDims.height, newAdjBuf);
				for (let i = 0; i < 2; i++) {
					positionFbs[i] = new graphics.Framebuffer(positionTextures[i].id, posDims.width, posDims.height);
				}
				pingPongIndex = 0;

				//change glCanvas dimensions to positions texture width and height
				canvas.width = posDims.width;
				canvas.height = posDims.height;
				graphics.Shader.setViewportDims(posDims.width, posDims.height);

				ctx.postMessage({ type: MessageType.InputDone, payload: { posBuf, posDims } });
				break;
			}

			case (MessageType.Reload): {
				//put network buffers into textures
				[posBuf, posDims] = network.genPositionsBuffer(settings.bendsEnabled ? settings.bendInterval : Number.POSITIVE_INFINITY, true);

				//cleanup old GPU data
				for (let i = 0; i < 2; i++) {
					if (positionTextures[i] != null) {
						positionTextures[i].dispose();
					}
					if (positionFbs[i] != null) {
						positionFbs[i].dispose();
					}
				}

				//create new textures and framebuffers
				positionTextures[0] = graphics.Texture.makePositionTexture(posDims.width, posDims.height, posBuf);
				positionTextures[1] = graphics.Texture.makePositionTexture(posDims.width, posDims.height, new Float32Array(4 * posDims.width * posDims.height));
				for (let i = 0; i < 2; i++) {
					positionFbs[i] = new graphics.Framebuffer(positionTextures[i].id, posDims.width, posDims.height);
				}
				pingPongIndex = 0;

				ctx.postMessage({ type: MessageType.ReloadDone, payload: { posBuf, posDims } });
				break;
			}
			case (MessageType.Step): {

				step(0.01);

				/*iterations++;
				if (iterations % 1000 == 0) {
					console.log(iterations);
				}*/

				ctx.postMessage({ type: MessageType.Done });
				break;
			}
			case (MessageType.Settings): {
				settings = ev.data.payload as dynnoslice.ui.Settings;

				ctx.postMessage({ type: MessageType.SettingsDone });
				break;
			}
			case (MessageType.Experiment): {
				const iterations = ev.data.payload as number;
				const start = performance.now();

				for (let i = 0; i < iterations; i++) {
					step((iterations - i) / iterations);
				}

				ctx.postMessage({ type: MessageType.ExperimentDone, payload: performance.now() - start });
				break;
			}
			default: {
				console.error("Could not recognize message", ev.data);
				break;
			}
		}
	}
}