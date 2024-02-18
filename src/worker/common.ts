namespace worker {

	export enum MessageType {
		InitialSetup = "InitialSetup",
		Input = "Input",
		Settings = "Settings",
		Step = "Step", //
		Request = "Request",

		Done = "Done",
	}

	export interface Message {
		type: MessageType;
		payload?: any;
	}
}