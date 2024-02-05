namespace dynnoslice.ui {

	interface NodeParams {
		label: string;
		pos: KnockoutObservable<math.Vec2>;
	}

	interface ViewModel {
		label: string;
		pos: KnockoutObservable<math.Vec2>;
		bBox: KnockoutObservable<DOMRect>;
		transform: KnockoutComputed<string>;
		childrenComplete: () => void;
	}

	ko.components.register("graph-node", {
		viewModel: {
			createViewModel: (params: NodeParams, componentInfo: KnockoutComponentTypes.ComponentInfo) => {
				const viewModel: ViewModel = {
					label: params.label,
					pos: params.pos,
					bBox: ko.observable(new DOMRect(0, 0, 0, 0)),
					transform: ko.pureComputed(() => {
						const bBox = viewModel.bBox();
						return `translate(${viewModel.pos().x - bBox.width / 2}, ${viewModel.pos().y - bBox.height / 2})`
					}),
					childrenComplete: () => {
						//viewModel.bBox((componentInfo.element as HTMLElement).nextElementSibling.querySelector("text").getBBox());
					}
				};

				return viewModel;
			}
		},
		template: `
			<g data-bind="attr: {transform: transform}, childrenComplete: childrenComplete">
				<rect fill="white" stroke="black" data-bind="attr: {width: bBox().width, height: bBox().height}"></rect>
				<text data-bind="text: label"></text>
			</g>
		`
	});
}