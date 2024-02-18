namespace worker {

	const ctx: Worker = <any>self;
	const canvas = new OffscreenCanvas(1, 1);

	ctx.onmessage = (ev: MessageEvent<Message>) => {
		switch (ev.data.type) {
			case (MessageType.InitialSetup): {
				//setup webgl
				const gl = canvas.getContext("webgl2");
				const renderToFloatExt = gl.getExtension("EXT_color_buffer_float");
				console.log(renderToFloatExt);
				gl.clearColor(1.0, 1.0, 1.0, 1.0);
				graphics.Shader.init(gl);

				ctx.postMessage({ type: MessageType.Done });
				break;
			}
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
			case (MessageType.Done): {
				ctx.postMessage({ type: MessageType.Done });
				break;
			}
			default: {
				console.error("Could not recognize message", ev.data);
				break;
			}
		}
	}
}