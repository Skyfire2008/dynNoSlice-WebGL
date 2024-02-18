namespace dynnoslice.ui {

	interface ConfigProps {
		settings: Settings;
		onSettingsChange: (settings: Settings) => void;
		onReload: () => void;
	}

	export const Config: React.FC<ConfigProps> = ({ settings, onSettingsChange, onReload }) => {

		const onCheck = (name: string) => {
			return (e: React.ChangeEvent<HTMLInputElement>) => {
				const value = settings[name] as boolean;
				const newSettings = Object.assign({}, settings, { [name]: !value });
				onSettingsChange(newSettings);
			};
		}

		const onNumberChange = (name: string, filter?: (value: number) => boolean) => {
			return (e: React.ChangeEvent<HTMLInputElement>) => {
				const value = Number.parseFloat(e.target.value);

				if (isNaN(value)) {
					return;
				}

				if (filter != null && filter(value)) {
					return;
				}

				const newSettings = Object.assign({}, settings, { [name]: value });
				onSettingsChange(newSettings)
			};
		};

		return (
			<div>
				<div className="setting">
					<label>Ideal edge length:</label>
					<input className="num-input" defaultValue={settings.idealEdgeLength} onBlur={onNumberChange("idealEdgeLength", (value) => value < 0)}></input>
				</div>
				<div className="setting">
					<label>Enabled bends:</label>
					<input type="checkbox" checked={settings.bendsEnabled} onChange={onCheck("bendsEnabled")}></input>
				</div>
				<div className="setting">
					<label>Bend time interval:</label>
					<input className="num-input" defaultValue={settings.bendInterval} disabled={!settings.bendsEnabled} onBlur={onNumberChange("bendInterval", (value) => value <= 0)}></input>
				</div>
				<div className="setting">
					<label>Enable bend time change:</label>
					<input type="checkbox" disabled={!settings.bendsEnabled} checked={settings.timeChangeEnabled} onChange={onCheck("timeChangeEnabled")}></input>
				</div>
				<div className="setting">
					<label>Enable repulsion:</label>
					<input type="checkbox" checked={settings.repulsionEnabled} onChange={onCheck("repulsionEnabled")}></input>
				</div>
				<div className="setting">
					<label>Enable attraction:</label>
					<input type="checkbox" checked={settings.attractionEnabled} onChange={onCheck("attractionEnabled")}></input>
				</div>
				<div className="setting">
					<label>Enable gravity:</label>
					<input type="checkbox" checked={settings.gravityEnabled} onChange={onCheck("gravityEnabled")}></input>
				</div>
				<div className="setting">
					<label>Enable trajectory straightening:</label>
					<input type="checkbox" checked={settings.trajectoryStraighteningEnabled} onChange={onCheck("trajectoryStraighteningEnabled")}></input>
				</div>
				<div className="setting">
					<label>Enable mental map preservation:</label>
					<input type="checkbox" checked={settings.mentalMapEnabled} onChange={onCheck("mentalMapEnabled")}></input>
				</div>
				<button onClick={onReload}>Reload dataset</button>
			</div>
		);
	};
}