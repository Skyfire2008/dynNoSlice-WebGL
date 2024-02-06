namespace dynnoslice.ui {

	export interface GraphEdgeProps {
		pos1: math.Vec2;
		pos2: math.Vec2;
	}

	export const GraphEdge: React.FC<GraphEdgeProps> = ({ pos1, pos2 }) => {
		return (<line x1={pos1.x} y1={pos1.y} x2={pos2.x} y2={pos2.y} stroke="black" strokeWidth="2"></line>);
	};
}