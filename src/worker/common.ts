namespace worker {

	export enum MessageType {
		InitialSetup = "InitialSetup",
		InitialSetupDone = "InitialSetupDone",

		Input = "Input",
		InputDone = "InputDone",

		Settings = "Settings",
		SettingsDone = "SettingsDone",

		Reload = "Reload",
		ReloadDone = "ReloadDone",

		Step = "Step",
		Done = "Done",

		Experiment = "Experiment",
		ExperimentDone = "ExperimentDone"
	}

	export interface Message {
		type: MessageType;
		payload?: any;
	}
}

namespace dynnoslice.ui {

	export interface Settings {
		bendInterval: number;
		bendsEnabled: boolean;
		timeChangeEnabled: boolean;
		idealEdgeLength: number;

		repulsionEnabled: boolean;
		attractionEnabled: boolean;
		gravityEnabled: boolean;
		trajectoryStraighteningEnabled: boolean;
		mentalMapEnabled: boolean;
		useExistingLayout: boolean;
		[key: string]: any;
	}

}