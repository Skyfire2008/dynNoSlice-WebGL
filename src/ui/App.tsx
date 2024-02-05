namespace dynnoslice.ui {

	export const App = () => {
		const [network, setNetwork] = React.useState<ExtNetwork>(null);
		const [posBuf, setPosBuf] = React.useState<Float32Array>(null);
		const [posDims, setPosDims] = React.useState<math.Dims>(null);

		const [timeSliderMin, settimeSliderMin] = React.useState(0);
		const [timeSliderMax, settimeSliderMax] = React.useState(1);
		const [timestamp, setTimestamp] = React.useState(0);

		const ctx = React.useRef<WebGL2RenderingContext>(null);
		const posShader = React.useRef<graphics.Shader>(null); //updates trajectories
		const quadShader = React.useRef<graphics.Shader>(null); //draws a textured quad
		const intervalsTexture = React.useRef<graphics.Texture>(null);
		const adjacenciesTexture = React.useRef<graphics.Texture>(null);
		const positionTextures = React.useRef<[graphics.Texture, graphics.Texture]>([null, null]);
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
		 * File input callback
		 * @param file file from file upload component 
		 */
		const onFileInput = (file: File) => {
			const network = new ExtNetwork(JSON.parse(file.contents));
			setNetwork(network);

			//update time slider
			settimeSliderMin(network.startTime);
			settimeSliderMax(network.endTime);

			//put network buffers into textures
			const [posBuf, posDims] = network.genPositionsBuffer(1);
			setPosBuf(posBuf);
			setPosDims(posDims);
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
			if (intervalsTexture.current != null) {
				intervalsTexture.current.dispose();
			}
			if (adjacenciesTexture.current != null) {
				adjacenciesTexture.current.dispose();
			}

			//create new textures and framebuffers
			positionTextures.current[0] = graphics.Texture.makePositionTexture(posDims.width, posDims.height, posBuf);
			positionTextures.current[1] = graphics.Texture.makePositionTexture(posDims.width, posDims.height, new Float32Array(4 * posDims.width * posDims.height));
			intervalsTexture.current = graphics.Texture.makeIntervalsTexture(1, intervalsBuf.length / 2, intervalsBuf);
			adjacenciesTexture.current = graphics.Texture.makeAdjacenciesTexture(adjDims.width, adjDims.height, adjacencyBuf);
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
			posShader.current.drawQuad();
			pingPongIndex.current = 1 - pingPongIndex.current;

			//readPixels to get update positions texture
			const buf = new Float32Array(tex.width * tex.height * 4);
			graphics.Shader.readPixels(tex.width, tex.height, buf);
			//console.log(buf);

			//draw the resulting texture
			graphics.Shader.unbindFramebuffer();
			tex = positionTextures.current[pingPongIndex.current];
			graphics.Shader.clear();
			quadShader.current.use();
			tex.bind(graphics.gl.TEXTURE0);
			quadShader.current.setInt("posTex", 0);
			quadShader.current.drawQuad();
		};

		const onSliderChange = (time: number) => {
			setTimestamp(time);
		};

		return (
			<div>
				<FileUpload accept=".json" label="Select graph file" callback={onFileInput}></FileUpload>
				<GraphSvg width={1280} height={720} network={network} timestamp={timestamp} posBuf={posBuf} posDims={posDims}></GraphSvg>
				<button onClick={step}>Step</button>
				<TimeSlider min={timeSliderMin} max={timeSliderMax} value={timestamp} onChange={onSliderChange}></TimeSlider>
				<canvas ref={glCanvasRef}></canvas>
			</div>);
	};
}