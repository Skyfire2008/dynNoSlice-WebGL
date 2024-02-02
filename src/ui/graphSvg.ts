namespace dynnoslice.ui {

	interface GraphSvgParams {
		width: number;
		height: number;
	}

	interface ViewModel {
		width: number;
		height: number;
		viewBox: string;//TODO: temp
	}

	ko.components.register("graph-svg", {
		viewModel: {
			createViewModel: (params: GraphSvgParams, componentInfo: KnockoutComponentTypes.ComponentInfo) => {
				const viewModel: ViewModel = {
					width: params.width,
					height: params.height,
					viewBox: `0 0 ${params.width} ${params.height}`
				};

				console.log("graph-svg working!");

				return viewModel;
			}
		},
		template: `
			<svg data-bind="attr: {width: width, height: height, viewBox: viewBox}"></svg>
		`
	});
}