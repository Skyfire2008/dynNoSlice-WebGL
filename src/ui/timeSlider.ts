namespace dynnoslice.ui {

	export interface TimeSliderValue {
		time: number; //time set by the slider
		index: number; //index of starting layer
		mult: number; //interpolation multiplier
	}

	interface TimeSliderParams {
		data: KnockoutObservable<Array<number>>;
		onChange: (value: TimeSliderValue) => void;
	}

	interface ViewModel {
		//prevValue: TimeSliderValue;
		data: KnockoutObservable<Array<number>>;
		datalistId: string;
		min: KnockoutObservable<number>;
		max: KnockoutObservable<number>;
		onChange: (data: any, e: InputEvent) => void;
	}

	let datalistNum = 0;

	ko.components.register("time-slider", {
		viewModel: {
			createViewModel: (params: TimeSliderParams, componentInfo: KnockoutComponentTypes.ComponentInfo) => {
				const viewModel: ViewModel = {
					/*prevValue: {
						time: 0,
						index:0,
						mult: 0
					},*/
					data: ko.observable([]),
					datalistId: "datalist" + datalistNum++,
					min: ko.observable(0),
					max: ko.observable(1),
					onChange: (data: any, e: InputEvent) => {
						const newValue = parseFloat((<HTMLInputElement>e.target).value);

						let i = 0;
						const items = viewModel.data();
						for (i; i < items.length; i++) {
							const item = items[i];
							if (item > newValue) {
								break;
							}
						}

						let mult = 0;
						if (i < items.length) {
							mult = (newValue - items[i - 1]) / (items[i] - items[i - 1]);
						}
						i--;

						params.onChange({
							index: i,
							time: newValue,
							mult
						});
					}
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
				<input type="range" step="any" data-bind="attr: {list: datalistId, min: min, max: max}, event: {input: onChange}" style="width: 1280px"></input>
				<datalist data-bind="attr: {id: datalistId}">
					<!-- ko foreach: data -->
						<option data-bind="attr: {value: $data}"></option>
					<!-- /ko -->
				</datalist>
			</div>
		`
	});
}
