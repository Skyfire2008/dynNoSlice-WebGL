namespace dynnoslice.ui {

	interface TimeSliderParams {
		data: Array<number>;
		value: KnockoutObservable<any>;
	}

	interface ViewModel {
		data: Array<number>;
	}

	ko.components.register("time-slider", {
		viewModel: {
			createViewModel: (params: TimeSliderParams, componentInfo: KnockoutComponentTypes.ComponentInfo) => {
				const viewModel: ViewModel = {
					data: params.data == null ? [] : params.data
				};

				return viewModel;
			},
		},
		template: `
			<div>
				<input type="range">
					<datalist>
						<!-- ko foreach: data -->
							<option data-bind="attr: {value: $data}"></option>
						<!-- /ko -->
					</datalist>
				</input>
			</div>
		`
	});
}