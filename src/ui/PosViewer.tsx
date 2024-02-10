namespace dynnoslice.ui {

	const svgWidth = 1280;
	const svgHeight = 20;

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
		num: number;

		timestamp?: number;
		posBufWidth?: number;
		startTime?: number;
		endTime?: number;
	}

	const NodeViewer: React.FC<NodeViewerProps> = ({ label, trajectory, num, timestamp, posBufWidth, startTime, endTime }) => {

		//trajectory point at timestamp
		const pos = React.useMemo(() => {

			for (let i = 0; i < trajectory.length - 1; i++) {
				const current = trajectory[i];
				const next = trajectory[i + 1];

				if (current.t > timestamp) {
					break;
				}

				if (current.t <= timestamp && timestamp < next.t && !current.final) {
					const mult = (timestamp - current.t) / (next.t - current.t);
					const x = math.lerp(current.x, next.x, mult);
					const y = math.lerp(current.y, next.y, mult);
					return new math.Vec2([x, y]);
				}
			}

			return new math.Vec2([NaN, NaN]);

		}, [trajectory, timestamp]);

		const rectangles = React.useMemo(() => {
			const result: Array<JSX.Element> = [];

			if (posBufWidth == 0) {
				return result;
			}

			const rectWidth = svgWidth / posBufWidth;
			for (let i = 0; i < posBufWidth; i++) {
				result.push(<rect x={i * rectWidth} y={0} width={rectWidth} height={svgHeight} fill={i % 2 == 0 ? "transparent" : "#00000020"} stroke="none"></rect>);
			}
			return result;

		}, [posBufWidth]);

		const svgTrajectory = React.useMemo(() => {
			const result: Array<JSX.Element> = [];
			const totalTime = endTime - startTime;

			for (let i = 0; i < trajectory.length - 1; i++) {
				const current = trajectory[i];
				if (current.final) {
					continue;
				}

				const next = trajectory[i + 1];

				const x1 = svgWidth * (current.t - startTime) / totalTime;
				const x2 = svgWidth * (next.t - startTime) / totalTime;
				result.push(<line x1={x1} y1={svgHeight / 2} x2={x2} y2={svgHeight / 2} stroke={next.t > current.t ? "black" : "red"} strokeWidth={2}></line>);
			}

			//TODO: REMOVE CIRCLES after end
			for (let i = 0; i < trajectory.length; i++) {
				const point = trajectory[i];
				if (point.final) {
					if (trajectory[i - 1].final) {
						break;
					}
				}

				const x = svgWidth * (point.t - startTime) / totalTime;
				result.push(
					<circle cx={x} cy={svgHeight / 2} r={4} fill={point.final ? "white" : "black"} stroke="black">
						<title>x:{point.x} y:{point.y}</title>
					</circle>
				);
			}

			return result;
		}, [trajectory]);

		const timeMarker = React.useMemo(() => {
			const totalTime = endTime - startTime;
			const x = svgWidth * (timestamp - startTime) / totalTime;
			return <line x1={x} y1={0} x2={x} y2={svgHeight} stroke="red"></line>;
		}, [timestamp]);

		return (
			<div className="row" style={{ backgroundColor: num % 2 == 0 ? "lightcyan" : "white" }}>
				<div className="pos-viewer-label">{label}</div>
				<div className="pos-viewer-num">{isNaN(pos.x) ? "N/A" : pos.x}</div>
				<div className="pos-viewer-num">{isNaN(pos.y) ? "N/A" : pos.y}</div>
				<svg width={svgWidth} height={svgHeight}>
					{rectangles}{svgTrajectory}{timeMarker}
				</svg>
			</div>
		);
	};

	export const PosViewer: React.FC<PosViewerProps> = ({ network, posBuf, posDims, timestamp, width, height: maxHeight }) => {

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
						num: i
					});
				}
			}

			return result;
		}, [network, trajectories]);

		return (
			<div style={{ width, maxHeight: maxHeight, overflow: "auto" }}>
				<div className="column">
					{nodeProps.map((props) => <NodeViewer {...props} timestamp={timestamp} posBufWidth={posDims.width - 1} startTime={network.startTime} endTime={network.endTime}></NodeViewer>)}
				</div>
			</div>
		);
	}
}