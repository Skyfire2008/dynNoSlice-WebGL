namespace dynnoslice {

	interface ViewModel {
		graphFile: KnockoutObservable<File>;
	}

	let mainCanvas: HTMLCanvasElement;
	let ctx: WebGL2RenderingContext;

	window.addEventListener("load", () => {
		mainCanvas = <HTMLCanvasElement>document.getElementById("mainCanvas");
		ctx = mainCanvas.getContext("webgl2");

		const viewModel: ViewModel = {
			graphFile: ko.observable(null)
		};

		ko.applyBindings(viewModel);
	});

}