namespace dynnoslice.ui {

	const nodeViewerHeight = 20;

	interface PosViewerProps {
		network: ExtNetwork;
		posBuf: Float32Array;
		posDims: math.Dims;
		timestamp: number;
		width: number;
		height: number;
	}

	interface NodeViewerProps {
		label: string;
		trajectory: util.Trajectory;
		timestamp?: number;
		y: number;
	}

	const NodeViewer: React.FC<NodeViewerProps> = ({ label, trajectory, y, timestamp }) => {

		//TODO: also check for before
		//trajectory point at timestamp
		const pos = React.useMemo(() => {

			for (let i = 0; i < trajectory.length; i++) {
				const current = trajectory[i];

				//trajectory is over
				if (current.final && i > 0 && trajectory[i - 1].final) {
					return new math.Vec2([NaN, NaN]);
				}

				if (current.t >= timestamp) {

					if (i == 0) {
						return new math.Vec2([current.x, current.y]);
					} else {

						const prev = trajectory[i - 1];
						if (prev.final) { //if previous was final, no trajectory in interval [prev.t, current.t]
							return new math.Vec2([NaN, NaN]);
						} else {//otherwise, interpolate
							const mult = (timestamp - prev.t) / (current.t - prev.t);
							const negMult = 1.0 - mult;
							return new math.Vec2([prev.x * negMult + current.x * mult, prev.y * negMult + current.y * mult]);
						}
					}
				}
			}

		}, [trajectory, timestamp]);

		return (
			<g transform={`translate(0, ${y})`}>
				<text>{label} {pos.x} {pos.y}</text>
			</g>
		);
	};

	export const PosViewer: React.FC<PosViewerProps> = ({ network, posBuf, posDims, timestamp, width, height }) => {

		const trajectories = React.useMemo(() => {
			if (posBuf != null) {
				return util.getTrajectories(posBuf, posDims.width);
			} else {
				return []
			}
		}, [posBuf, posDims]);

		const nodeProps = React.useMemo(() => {
			const result: Array<NodeViewerProps> = [];

			if (network != null) {
				for (let i = 0; i < network.nodes.length; i++) {
					result.push({
						label: network.nodes[i].label,
						trajectory: trajectories[i],
						y: i * nodeViewerHeight
					});
				}
			}

			return result;
		}, [network, trajectories]);

		return (
			<div style={{ width, height, overflow: "auto" }}>
				<svg width={width} height={network && network.nodes.length * nodeViewerHeight}>{
					nodeProps.map((props) => <NodeViewer {...props} timestamp={timestamp}></NodeViewer>)
				}</svg>
			</div>
		);
	}
}