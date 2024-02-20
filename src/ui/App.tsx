namespace dynnoslice.ui {

	export const App = () => {
		const [network, setNetwork] = React.useState<ExtNetwork>(null);
		const posBuf = React.useRef<Float32Array>(null);
		const posDims = React.useRef<math.Dims>(null);
		const [trajectories, setTrajectories] = React.useState<Array<util.Trajectory>>([]);

		const thread = React.useRef<Worker>(null);

		const [timeSliderMin, setTimeSliderMin] = React.useState(0);
		const [timeSliderMax, setTimeSliderMax] = React.useState(1);
		const [timestamp, setTimestamp] = React.useState(0);

		const running = React.useRef(false);
		const frameId = React.useRef<number>(null);

		//SETTINGS:
		const [settings, setSettings] = React.useState<Settings>({
			bendInterval: 1,
			bendsEnabled: true,
			timeChangeEnabled: false,
			idealEdgeLength: 1,
			repulsionEnabled: true,
			attractionEnabled: true,
			trajectoryStraighteningEnabled: true,
			gravityEnabled: true,
			mentalMapEnabled: true
		});

		//initialization
		React.useEffect(() => {
			//setup worker
			thread.current = new Worker("worker/worker.js");
			thread.current.addEventListener("message", (e: MessageEvent<worker.Message>) => {
				switch (e.data.type) {
					case (worker.MessageType.InitialSetupDone): {

						break;
					}
					case (worker.MessageType.InputDone): {
						posDims.current = e.data.payload.posDims;
						posBuf.current = e.data.payload.posBuf;
						setTrajectories(util.getTrajectories(posBuf.current, posDims.current.width));
						break;
					}
					case (worker.MessageType.ReloadDone): {
						posDims.current = e.data.payload.posDims;
						posBuf.current = e.data.payload.posBuf;
						setTrajectories(util.getTrajectories(posBuf.current, posDims.current.width));
						break;
					}
					case (worker.MessageType.Done): {
						if (frameId.current == null) {
							frameId.current = requestAnimationFrame(() => {
								frameId.current = null;
								setTrajectories(util.getTrajectories(posBuf.current, posDims.current.width));
							});
						}

						if (running.current == true) {
							step();
						}
					}
				}
			});

			thread.current.postMessage({ type: worker.MessageType.InitialSetup, payload: settings });

			return () => {
				thread.current.terminate();
			};
		}, []);

		/**
		 * Reload dataset, generate new random positions using the config
		 */
		const reloadDataset = () => {
			thread.current.postMessage({ type: worker.MessageType.Reload });
		};

		/**
		 * File input callback
		 * @param file file from file upload component 
		 */
		const onFileInput = (file: File) => {
			const json = JSON.parse(file.contents);
			const network = new ExtNetwork(json);
			setNetwork(network);

			//reset trajectories
			setTrajectories([]);

			//update time slider
			setTimeSliderMin(network.startTime);
			setTimeSliderMax(network.endTime);
			setTimestamp(network.startTime);
			//TODO: disable start/stop/step until thread replies

			//send network to thread
			thread.current.postMessage({ type: worker.MessageType.Input, payload: json });
		};

		const step = () => {
			thread.current.postMessage({ type: worker.MessageType.Step });
		};

		const start = () => {
			running.current = true;
			step();
		};

		const stop = () => {
			running.current = false;
		};

		const onSliderChange = (time: number) => {
			setTimestamp(time);
		};

		const onSettingsChange = (newSettings: Settings) => {
			setSettings(newSettings);

			thread.current.postMessage({ type: worker.MessageType.Settings, payload: newSettings });
		};

		return (
			<div className="column">
				<FileUpload accept=".json" label="Select graph file" callback={onFileInput}></FileUpload>
				<div className="row">
					<GraphSvg width={1280} height={720} network={network} timestamp={timestamp} trajectories={trajectories} posDims={posDims.current}></GraphSvg>
					<Config settings={settings} onSettingsChange={onSettingsChange} onReload={reloadDataset}></Config>
				</div>
				<div>
					<button onClick={start}>Start</button>
					<button onClick={stop}>Stop</button>
					<button onClick={step}>Step</button>
				</div>
				<TimeSlider min={timeSliderMin} max={timeSliderMax} value={timestamp} onChange={onSliderChange}></TimeSlider>
				{/*<PosViewer posBufObserver={posBufObserver.current} posDims={posDims} network={network} timestamp={timestamp} width={1800} height={200}></PosViewer>*/}
			</div >);
	};
}