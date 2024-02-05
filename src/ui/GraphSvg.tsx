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

		/**
		 * Ids of nodes present at this moment in time
		 */
		const nodeIds = React.useMemo(() => {

			//skip if network is null
			if (network == null) {
				return new Set<number>();
			}

			const edges: Array<Edge> = [];
			const result = new Set<number>();
			for (const edge of network.edges) {
				if (util.findInterval(edge.intervals, timestamp) != null) {
					edges.push(edge);
					result.add(edge.from);
					result.add(edge.to);
				}
			}

			return result;
		}, [network, timestamp]);

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
				result.push({ label: network.nodes[id].label, pos });
			}

			return result;
		}, [nodePositions]);

		return (
			<svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
				{nodes.map((props) => <GraphNode {...props}></GraphNode>)}
			</svg>
		);
	};
}