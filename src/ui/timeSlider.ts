namespace dynnoslice.ui {

	export interface TimeSliderValue{
		time: number;
		index: number;
		mult: number;
	}

	interface TimeSliderParams {
        data: KnockoutObservable<Array<number>>;
        onChange: (value: TimeSliderValue) => void;
	}

	interface ViewModel {
		data: KnockoutObservable<Array<number>>;
		datalistId: string;
		min: KnockoutObservable<number>;
        max: KnockoutObservable<number>;
        onChange: (value: TimeSliderValue) => void;
	}

	let datalistNum = 0;

	ko.components.register("time-slider", {
		viewModel: {
			createViewModel: (params: TimeSliderParams, componentInfo: KnockoutComponentTypes.ComponentInfo) => {
				const viewModel: ViewModel = {
					data: ko.observable([]),
					datalistId: "datalist" + datalistNum++,
					min: ko.observable(0),
                    max: ko.observable(1),
                    onChange: params.onChange
				};

				params.data.subscribe((data) => {
					if (data != null && data.length > 0) {
						viewModel.data(data);
						viewModel.min(data[0]);
						viewModel.max(data[data.length - 1]);
					} else {
						viewModel.data([]);
						viewModel.min(0);
						viewModel.max(1);
					}
				})

				return viewModel;
			},
		},
		template: `
			<div>
				<input type="range" step="any" data-bind="attr: {list: datalistId, min: min, max: max}, event: {input: onChange}"></input>
				<datalist data-bind="attr: {id: datalistId}">
					<!-- ko foreach: data -->
						<option data-bind="attr: {value: $data}"></option>
					<!-- /ko -->
				</datalist>
			</div>
		`
	});
}
