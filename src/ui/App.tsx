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

						if (wantExport.current) {
							exportGraph();
							wantExport.current = false;
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
					<FileUpload accept=".json" label="Select graph file" callback={onFileInput}></FileUpload>
					<button onClick={onExportClick}>Export</button>
				</div>
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
				<PosViewer posDims={posDims} network={network} trajectories={trajectories} timestamp={timestamp} width={1800} height={200}></PosViewer>
			</div >);
	};
}