namespace dynnoslice.ui {

	interface GraphSvgProps {
		width: number;
		height: number;
		network: ExtNetwork;
		posBuf: Float32Array;
		posDims: math.Dims;
		timestamp: number;
	}

	export const GraphSvg: React.FC<GraphSvgProps> = ({ width, height, network, posBuf, posDims, timestamp }) => {

		//used to check if network changed
		const prevNetwork = React.useRef(network);

		//React cannot instanly get the bounding box of an element, so it has to render it first, which cause flickering
		//to reduce the flickering, the calculated bounding boxes are stored in parent element and reused
		const nodeTextBoxes = React.useRef(new Map<number, DOMRect>());

		//reset precomputed text boxes if network changed
		if (network != prevNetwork.current) {
			prevNetwork.current = network;
			nodeTextBoxes.current.clear();
		}
		const setTextBox = (id: number, textBox: DOMRect) => {
			nodeTextBoxes.current.set(id, textBox);
		}

		/**
		 * Edges present at given timestamp
		 */
		const edges = React.useMemo(() => {
			if (network == null) {
				//skip if network is null
				return [];
			} else {
				return network.edges.filter((edge) => {
					return util.findInterval(edge.intervals, timestamp) != null;
				});
			}

		}, [network, timestamp]);

		/**
		 * Ids of nodes present at given timestamp
		 */
		const nodeIds = React.useMemo(() => {
			const result = new Set<number>();
			for (const edge of edges) {
				result.add(edge.from);
				result.add(edge.to);
			}

			return result;
		}, [edges]);

		/**
		 * Maps node ids to their positions
		 */
		const nodePositions = React.useMemo(() => {
			const result = new Map<number, math.Vec2>();
			for (const id of nodeIds) {
				const pos = util.findPosition(posBuf, posDims.width, id, timestamp);
				pos.x *= width;
				pos.y *= height;
				result.set(id, pos);
			}

			return result;
		}, [nodeIds, posBuf]);

		const nodes = React.useMemo(() => {
			const result: Array<GraphNodeProps> = [];
			for (const [id, pos] of nodePositions) {
				result.push({
					label: network.nodes[id].label,
					pos,
					savedTextBox: nodeTextBoxes.current.get(id),
					textBoxCallback: setTextBox.bind(null, id)
				});
			}

			return result;
		}, [nodePositions]);

		return (
			<svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
				{edges.map((edge) => <GraphEdge pos1={nodePositions.get(edge.from)} pos2={nodePositions.get(edge.to)}></GraphEdge>)}
				{nodes.map((props) => <GraphNode {...props}></GraphNode>)}
			</svg>
		);
	};
}