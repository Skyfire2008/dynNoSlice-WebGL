namespace dynnoslice.ui {

	interface GraphSvgParams {
		width: number;
		height: number;
		network: KnockoutObservable<Network>;
		posBuf: KnockoutObservable<Float32Array>;
		posDims: KnockoutObservable<math.Dims>;
		timestamp: KnockoutObservable<number>;
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

				//subscribe to timestamp changes
				params.timestamp.subscribe((time) => {
					const network = params.network();

					//get edges and nodes present at timestamp
					const edges: Array<Edge> = [];
					const nodeIds = new Set<number>();
					for (const edge of network.edges) {
						if (util.findInterval(edge.intervals, time) != null) {
							edges.push(edge);
							nodeIds.add(edge.from);
							nodeIds.add(edge.to);
						}
					}

					//find positions of nodes
					const nodePositions = new Map<number, math.Vec2>();
					for (const id of nodeIds) {
						const pos = util.findPosition(params.posBuf(), params.posDims().width, id, time);
						pos.x *= params.width;
						pos.y *= params.height;
						nodePositions.set(id, pos);
					}

					console.log(nodePositions);
				});

				console.log("graph-svg working!");

				return viewModel;
			}
		},
		template: `
			<svg data-bind="attr: {width: width, height: height, viewBox: viewBox}"></svg>
		`
	});
}