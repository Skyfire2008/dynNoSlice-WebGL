namespace dynnoslice.ui {

	interface GraphSvgProps {
		width: number;
		height: number;
		network: ExtNetwork;
		trajectories: Array<util.Trajectory>;
		posDims: math.Dims;
		timestamp: number;
	}

	export const GraphSvg: React.FC<GraphSvgProps> = ({ width, height, network, trajectories, posDims, timestamp }) => {
		const [pan, setPan] = React.useState(new math.Vec2([-width / 2, -height / 2]));
		const [zoom, setZoom] = React.useState(1);
		const svgRef = React.useRef<SVGSVGElement>();
		const dragStartPos = React.useRef<math.Vec2>(null);
		const prevPan = React.useRef(pan);

		//React cannot instanly get the bounding box of an element, so it has to render it first, which causes flickering
		//to reduce the flickering, the calculated bounding boxes are stored in parent element and reused
		const nodeTextBoxes = React.useRef(new Map<number, DOMRect>());
		const prevNetwork = React.useRef(network);

		//reset precomputed text boxes if network changed
		if (network != prevNetwork.current) {
			prevNetwork.current = network;
			nodeTextBoxes.current.clear();
		}

		const [baseNodePositions, presentEdges] = React.useMemo(() => {
			const nodePosMap = new Map<number, math.Vec2>();

			if (network == null || trajectories.length == 0) {
				return [nodePosMap, []];
			}

			for (let i = 0; i < network.nodes.length; i++) {
				const pos = util.findPosition(trajectories[i], timestamp);
				if (pos != null) {
					nodePosMap.set(i, pos);
				}
			}

			const presentEdges: Array<Edge> = network.edges.filter((edge) => {
				return util.findInterval(edge.intervals, timestamp) != null;
			});

			return [nodePosMap, presentEdges];
		}, [trajectories, timestamp, network]);

		//claculate new nodes and edges whenever baseNodePositions, pan or zoom change
		const [nodes, edges] = React.useMemo(() => {
			const nodes: Array<GraphNodeProps> = [];
			const edges: Array<GraphEdgeProps> = [];
			const tfPosMap = new Map<number, math.Vec2>();

			for (const [id, pos] of baseNodePositions) {
				//transform the position according to zoom and pan
				const tfPos = pos.clone();
				tfPos.sub(pan);
				tfPos.mult(1 / zoom);
				tfPosMap.set(id, tfPos);

				nodes.push({
					label: network.nodes[id].label,
					pos: tfPos,
					savedTextBox: nodeTextBoxes.current.get(id),
					textBoxCallback: (textBox: DOMRect) => {
						nodeTextBoxes.current.set(id, textBox);
					}
				});
			}

			for (const edge of presentEdges) {
				edges.push({
					pos1: tfPosMap.get(edge.from),
					pos2: tfPosMap.get(edge.to)
				});
			}

			return [nodes, edges];
		}, [baseNodePositions, pan, zoom]);

		// mouse event handler to pan the graph
		const onMouseDown = (e: React.MouseEvent<SVGSVGElement>) => {
			dragStartPos.current = new math.Vec2([e.clientX, e.clientY]);
			prevPan.current = pan.clone();
		};

		const onMouseUp = (e: React.MouseEvent<SVGSVGElement>) => {
			dragStartPos.current = null;
		};

		const onMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
			if (dragStartPos.current != null) {
				const diff = math.Vec2.diff(new math.Vec2([e.clientX, e.clientY]), dragStartPos.current);
				diff.mult(zoom);
				setPan(math.Vec2.diff(prevPan.current, diff));
			}
		};

		const onWheel = (e: WheelEvent) => {
			e.preventDefault();

			const mousePos = new math.Vec2([e.offsetX, e.offsetY]);
			const shapeMouse = mousePos.clone();
			shapeMouse.mult(zoom);
			shapeMouse.add(pan);

			let mult: number = 0;
			if (e.deltaY > 0) {
				mult = 2;
			} else {
				mult = 0.5;
			}
			setZoom(zoom * mult);

			//set pan in such a way that the point at cursor remains at the same place
			const newPan = pan.clone();
			newPan.mult(mult);
			shapeMouse.mult(1 - mult);
			newPan.add(shapeMouse);
			setPan(newPan);
		};

		//attach wheel event manually, cause React doesn't support active events
		React.useEffect(() => {
			svgRef.current.addEventListener("wheel", onWheel, { passive: false });
			return () => svgRef.current.removeEventListener("wheel", onWheel);
		});

		return (
			<svg ref={svgRef} width={width} height={height} viewBox={`0 0 ${width} ${height}`} onMouseDown={onMouseDown} onMouseUp={onMouseUp} onMouseMove={onMouseMove}>
				{edges.map((props, i) => <GraphEdge {...props} key={i}></GraphEdge>)}
				{nodes.map((props, i) => <GraphNode {...props} key={i}></GraphNode>)}
			</svg>
		);
	};
}