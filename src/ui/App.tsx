namespace dynnoslice.ui {

	export const App = () => {
		const [network, setNetwork] = React.useState<ExtNetwork>(null);
		const [posBuf, setPosBuf] = React.useState<Float32Array>(null);
		const [posDims, setPosDims] = React.useState<math.Dims>(null);

		const [timeSliderMin, setTimeSliderMin] = React.useState(0);
		const [timeSliderMax, setTimeSliderMax] = React.useState(1);
		const [timestamp, setTimestamp] = React.useState(0);

		const [running, setRunning] = React.useState(false);
		const frameId = React.useRef(0);

		//SETTINGS:
		const [bendInterval, setBendInterval] = React.useState(1);
		const [bendsEnabled, setBendsEnabled] = React.useState(true);
		const [timeChangeEnabled, setTimeChangeEnabled] = React.useState(true);
		const [idealEdgeLength, setIdealEdgeLength] = React.useState(1);
		const [repulsionEnabled, setRepulsionEnabled] = React.useState(true);
		const [attractionEnabled, setAttractionEnabled] = React.useState(true);
		const [trajectoryStraighteningEnabled, setTrajectoryStraighteningEnabled] = React.useState(true);
		const [gravityEnabled, setGravityEnabled] = React.useState(true);
		const [mentalMapEnabled, setMentalMapEnabled] = React.useState(true);

		const ctx = React.useRef<WebGL2RenderingContext>(null);
		const posShader = React.useRef<graphics.Shader>(null); //updates trajectories
		const quadShader = React.useRef<graphics.Shader>(null); //draws a textured quad
		const positionTextures = React.useRef<[graphics.Texture, graphics.Texture]>([null, null]);
		const newAdjTexture = React.useRef<graphics.Texture>(null);

		const positionFbs = React.useRef<[graphics.Framebuffer, graphics.Framebuffer]>([null, null]);
		const pingPongIndex = React.useRef(0); //source

		const glCanvasRef = React.useRef<HTMLCanvasElement>();

		//initialization
		React.useEffect(() => {
			ctx.current = glCanvasRef.current.getContext("webgl2");
			const renderToFloatExt = ctx.current.getExtension("EXT_color_buffer_float");
			console.log(renderToFloatExt);
			ctx.current.clearColor(1.0, 1.0, 1.0, 1.0);

			graphics.Shader.init(ctx.current);
			posShader.current = new graphics.Shader(shaders.drawQuadVert, shaders.updatePositionsFrag);
			quadShader.current = new graphics.Shader(shaders.drawQuadVert, shaders.drawQuadFrag);
			quadShader.current.use();
		}, []);

		/**
		 * Reload dataset, generate new random positions using the config
		 */
		const reloadDataset = () => {
			//put network buffers into textures
			const [posBuf, posDims] = network.genPositionsBuffer(bendsEnabled ? bendInterval : Number.POSITIVE_INFINITY);
			setPosBuf(posBuf);
			setPosDims(posDims);

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
			positionTextures.current[0] = graphics.Texture.makePositionTexture(posDims.width, posDims.height, posBuf);
			positionTextures.current[1] = graphics.Texture.makePositionTexture(posDims.width, posDims.height, new Float32Array(4 * posDims.width * posDims.height));
			for (let i = 0; i < 2; i++) {
				positionFbs.current[i] = new graphics.Framebuffer(positionTextures.current[i].id, posDims.width, posDims.height);
			}
			pingPongIndex.current = 0;
		};

		/**
		 * File input callback
		 * @param file file from file upload component 
		 */
		const onFileInput = (file: File) => {
			const network = new ExtNetwork(JSON.parse(file.contents));
			setNetwork(network);

			//update time slider
			setTimeSliderMin(network.startTime);
			setTimeSliderMax(network.endTime);
			setTimestamp(network.startTime);

			//put network buffers into textures
			const [posBuf, posDims] = network.genPositionsBuffer(bendsEnabled ? bendInterval : Number.POSITIVE_INFINITY);
			setPosBuf(posBuf);
			setPosDims(posDims);
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
			if (newAdjTexture.current != null) {
				newAdjTexture.current.dispose();
			}

			//create new textures and framebuffers
			positionTextures.current[0] = graphics.Texture.makePositionTexture(posDims.width, posDims.height, posBuf);
			positionTextures.current[1] = graphics.Texture.makePositionTexture(posDims.width, posDims.height, new Float32Array(4 * posDims.width * posDims.height));
			newAdjTexture.current = graphics.Texture.makeNewAdjTexture(newAdjDims.width, newAdjDims.height, newAdjBuf);
			for (let i = 0; i < 2; i++) {
				positionFbs.current[i] = new graphics.Framebuffer(positionTextures.current[i].id, posDims.width, posDims.height);
			}
			pingPongIndex.current = 0;

			//change glCanvas dimensions to positions texture width and height
			glCanvasRef.current.width = posDims.width;
			glCanvasRef.current.height = posDims.height;
			graphics.Shader.setViewportDims(posDims.width, posDims.height);
		};

		const step = () => {
			//use ping pong index to et correct framebuffer and texture
			let boundFb = positionFbs.current[1 - pingPongIndex.current];
			let tex = positionTextures.current[pingPongIndex.current];

			//render into framebuffer
			boundFb.bind();
			graphics.Shader.clear();
			posShader.current.use();

			tex.bind(graphics.gl.TEXTURE0);
			posShader.current.setInt("posTex", 0);
			newAdjTexture.current.bind(graphics.gl.TEXTURE1);
			posShader.current.setInt("newAdjTex", 1);

			//set settings
			posShader.current.setBool("timeChangeEnabled", timeChangeEnabled);
			posShader.current.setFloat("idealEdgeLength", idealEdgeLength);
			posShader.current.setBool("repulsionEnabled", repulsionEnabled);
			posShader.current.setBool("attractionEnabled", attractionEnabled);
			posShader.current.setBool("trajectoryStraighteningEnabled", trajectoryStraighteningEnabled);
			posShader.current.setBool("gravityEnabled", gravityEnabled);
			posShader.current.setBool("mentalMapEnabled", mentalMapEnabled);

			let startTime = window.performance.now();

			posShader.current.drawQuad();

			console.log(window.performance.now() - startTime);

			pingPongIndex.current = 1 - pingPongIndex.current;

			//readPixels to get update positions texture
			const buf = new Float32Array(tex.width * tex.height * 4);
			graphics.Shader.readPixels(tex.width, tex.height, buf);
			setPosBuf(buf);

			//draw the resulting texture
			graphics.Shader.unbindFramebuffer();
			tex = positionTextures.current[pingPongIndex.current];
			graphics.Shader.clear();
			quadShader.current.use();
			tex.bind(graphics.gl.TEXTURE0);
			quadShader.current.setInt("posTex", 0);
			quadShader.current.drawQuad();
		};

		const start = () => {
			setRunning(true);
		};

		const stop = () => {
			setRunning(false);
		};

		React.useEffect(() => {
			if (running) {
				frameId.current = requestAnimationFrame(() => { step() });
			} else {
				cancelAnimationFrame(frameId.current);
			}
		});

		const onSliderChange = (time: number) => {
			setTimestamp(time);
		};

		const onSettingsChange = (settings: Settings) => {
			setBendInterval(settings.bendInterval);
			setBendsEnabled(settings.bendsEnabled);
			setTimeChangeEnabled(settings.timeChangeEnabled);
			setIdealEdgeLength(settings.idealEdgeLength);
			setTrajectoryStraighteningEnabled(settings.trajectoryStraighteningEnabled);
			setGravityEnabled(settings.gravityEnabled);
			setRepulsionEnabled(settings.repulsionEnabled);
			setAttractionEnabled(settings.attractionEnabled);
			setMentalMapEnabled(settings.mentalMapEnabled);
		};

		return (
			<div className="column">
				<FileUpload accept=".json" label="Select graph file" callback={onFileInput}></FileUpload>
				<div className="row">
					<GraphSvg width={1280} height={720} network={network} timestamp={timestamp} posBuf={posBuf} posDims={posDims}></GraphSvg>
					<Config settings={{
						bendInterval,
						bendsEnabled,
						timeChangeEnabled,
						idealEdgeLength,
						repulsionEnabled,
						attractionEnabled,
						trajectoryStraighteningEnabled,
						gravityEnabled,
						mentalMapEnabled
					}} onSettingsChange={onSettingsChange} onReload={reloadDataset}></Config>
				</div>
				<div>
					<button onClick={start}>Start</button>
					<button onClick={stop}>Stop</button>
					<button onClick={step}>Step</button>
				</div>
				<TimeSlider min={timeSliderMin} max={timeSliderMax} value={timestamp} onChange={onSliderChange}></TimeSlider>
				<PosViewer posBuf={posBuf} posDims={posDims} network={network} timestamp={timestamp} width={1800} height={200}></PosViewer>
				<canvas ref={glCanvasRef}></canvas>
			</div >);
	};
}