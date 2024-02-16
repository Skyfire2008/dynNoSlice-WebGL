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

		const svgRef = React.useRef<SVGSVGElement>();
		const [pan, setPan] = React.useState(new math.Vec2([-width / 2, -height / 2]));
		const dragStartPos = React.useRef<math.Vec2>(null);
		const prevPan = React.useRef(pan);

		const [zoom, setZoom] = React.useState(1);

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

			const result: Array<number> = [];
			if (network == null) {
				//skip if network is null
				return [];
			} else {
				for (let i = 0; i < network.nodes.length; i++) {
					const node = network.nodes[i];
					if (util.findInterval(node.intervals, timestamp) != null) {
						result.push(i);
					}
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
				pos.sub(pan);
				pos.mult(1 / zoom);
				result.set(id, pos);
			}

			return result;
		}, [nodeIds, posBuf, pan, zoom]);

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

		// mouse vent handler to pan the graph
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
				{edges.map((edge) => <GraphEdge pos1={nodePositions.get(edge.from)} pos2={nodePositions.get(edge.to)}></GraphEdge>)}
				{nodes.map((props) => <GraphNode {...props}></GraphNode>)}
			</svg>
		);
	};
}