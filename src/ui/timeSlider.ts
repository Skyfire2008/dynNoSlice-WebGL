namespace dynnoslice.ui {

	interface TimeSliderParams {
		min: KnockoutObservable<number>;
		max: KnockoutObservable<number>;
		onChange: (value: number) => void;
	}

	interface ViewModel {
		min: KnockoutObservable<number>;
		max: KnockoutObservable<number>;
		onChange: (data: any, e: InputEvent) => void;
	}

	ko.components.register("time-slider", {
		viewModel: {
			createViewModel: (params: TimeSliderParams, componentInfo: KnockoutComponentTypes.ComponentInfo) => {
				const viewModel: ViewModel = {
					min: params.min,
					max: params.max,
					onChange: (data: any, e: InputEvent) => {
						const newValue = parseFloat((<HTMLInputElement>e.target).value);
						console.log(newValue);
						params.onChange(newValue);
					}
				};

				return viewModel;
			},
		},
		template: `
			<div>
				<input type="range" step="any" data-bind="attr: {min: min, max: max}, event: {input: onChange}" style="width: 1280px"></input>
			</div>
		`
	});
}
