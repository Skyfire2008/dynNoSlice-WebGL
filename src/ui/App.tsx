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
		const wantExport = React.useRef(false);
		const [experimentIterations, setExperimentIterations] = React.useState(100);
		const [experimentRunning, setExperimentRunning] = React.useState(false);

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
			mentalMapEnabled: true,
			useExistingLayout: false
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
					case (worker.MessageType.InputDone): { //worker has loaded the data
						posDims.current = e.data.payload.posDims;
						posBuf.current = e.data.payload.posBuf;
						setTrajectories(util.getTrajectories(posBuf.current, posDims.current.width));
						break;
					}
					case (worker.MessageType.ReloadDone): { // worker compelted reloading the data
						posDims.current = e.data.payload.posDims;
						posBuf.current = e.data.payload.posBuf;
						setTrajectories(util.getTrajectories(posBuf.current, posDims.current.width));
						break;
					}
					case (worker.MessageType.Done): { //worker is done with current step

						//update layout synchronously with frame
						if (frameId.current == null) {
							frameId.current = requestAnimationFrame(() => {
								frameId.current = null;
								setTrajectories(util.getTrajectories(posBuf.current, posDims.current.width));
							});
						}

						if (wantExport.current) {
							exportGraph();
							wantExport.current = false;
						}

						if (running.current == true) {
							step();
						}
						break;
					}
					case (worker.MessageType.ExperimentDone): { //worker completed the experiment
						frameId.current = requestAnimationFrame(() => {
							frameId.current = null;
							setTrajectories(util.getTrajectories(posBuf.current, posDims.current.width));
						});

						alert(`Experiment over in ${e.data.payload} milliseconds!`);

						setExperimentRunning(false);
						break;
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

			//reset settings.useExistingLayout if graph has no existing layout
			if (!network.hasExistingLayout && settings.useExistingLayout) {
				const newSettings = Object.assign({}, settings, { useExistingLayout: false });
				onSettingsChange(newSettings); //theoretically, need to wait for response from worker before sending it the input, but this should be fine
			}

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

		const exportGraph = () => {
			const result: OutputNetwork = { nodes: [], edges: network.edges };
			for (let i = 0; i < network.nodes.length; i++) {
				const node: OutputNode = { label: network.nodes[i].label, trajectories: [] };
				const trajectory = trajectories[i];

				let current: Array<{ x: number, y: number, t: number }> = [];
				for (const position of trajectory) {
					current.push({ x: position.x, y: position.y, t: position.t });
					if (position.final) {
						node.trajectories.push(current);
						current = [];
					}
				}

				result.nodes.push(node);
			}

			const a = document.createElement("a");
			a.download = "graph.json";
			a.href = URL.createObjectURL(new Blob([JSON.stringify(result)]));
			a.addEventListener("click", (e) => setTimeout(() => URL.revokeObjectURL(a.href), 1000));
			a.click();
		}

		const onExportClick = () => {
			if (running.current) {
				wantExport.current = true;
			} else {
				exportGraph();
			}
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

		const runExperiment = () => {
			thread.current.postMessage({ type: worker.MessageType.Experiment, payload: experimentIterations });
			setExperimentRunning(true);
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
				<div className="row">
					<FileUpload accept=".json" label="Select graph file" callback={onFileInput} disabled={experimentRunning}></FileUpload>
					<button onClick={onExportClick} disabled={experimentRunning}>Export</button>
				</div>
				<div className="row">
					<GraphSvg width={1280} height={720} network={network} timestamp={timestamp} trajectories={trajectories} posDims={posDims.current}></GraphSvg>
					<Config settings={settings} disabled={experimentRunning} hasExistingLayout={network?.hasExistingLayout == true} onSettingsChange={onSettingsChange} onReload={reloadDataset}></Config>
				</div>
				<div className="runControls">
					<div>
						<button onClick={start} disabled={experimentRunning}>Start</button>
						<button onClick={stop} disabled={experimentRunning}>Stop</button>
						<button onClick={step} disabled={experimentRunning}>Step</button>
					</div>
					<div>
						<label htmlFor="expIterInput">Experiment iterations:</label>
						<input id="expIterInput" type="number" className="num-input" value={experimentIterations} onChange={(e) => setExperimentIterations(e.target.valueAsNumber)}></input>
						<button onClick={runExperiment} disabled={experimentRunning}>Run experiment</button>
					</div>
				</div>
				<TimeSlider min={timeSliderMin} max={timeSliderMax} value={timestamp} onChange={onSliderChange}></TimeSlider>
				<PosViewer posDims={posDims} network={network} trajectories={trajectories} timestamp={timestamp} width={1800} height={200}></PosViewer>
			</div >);
	};
}