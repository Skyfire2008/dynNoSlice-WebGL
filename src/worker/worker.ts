namespace worker {
	export enum MessageType {
		Input = "Input",
		Settings = "Settings",
		Step = "Step", //
		Request = "Request",

		Done = "Done",
	};

	export interface Message {
		type: MessageType;
		payload?: any;
	}

	const ctx: Worker = <any>self;
	const canvas = new OffscreenCanvas(1, 1);
	const gl = canvas.getContext("webgl2");

	ctx.onmessage = (ev: MessageEvent<Message>) => {
		switch (ev.data.type) {
			case (MessageType.Input): {
				const network = ev.data.payload as dynnoslice.ExtNetwork;
				//TODO: perform setup here

				//TODO: create shared memory and send it back using "Input"
				ctx.postMessage({ type: MessageType.Done });
				break;
			}
			case (MessageType.Step): {
				//TODO: run calculations here

				ctx.postMessage({ type: MessageType.Done });
				break;
			}
			case (MessageType.Settings): {
				//TODO: update settings here

				ctx.postMessage({ type: MessageType.Done });
				break;
			}
		}
	}
}