namespace dynnoslice.ui {

	export interface GraphNodeProps {
		label: string;
		pos: math.Vec2;
	}

	export const GraphNode: React.FC<GraphNodeProps> = ({ label, pos }) => {
		const textRef = React.useRef<SVGTextElement>(null);
		const [textBox, setTextBox] = React.useState<DOMRect>(new DOMRect(0, 0, 0, 0));

		//need to render the text first to get its bounding box
		React.useEffect(() => {
			setTextBox(textRef.current.getBBox());
		}, [label]);

		return (<g transform={`translate(${pos.x - textBox.width / 2}, ${pos.y - textBox.height / 2})`}>
			<rect width={textBox.width} height={textBox.height} fill="white" stroke="black"></rect>
			<text ref={textRef} transform={`translate(${-textBox.x}, ${-textBox.y})`}>{label}</text>
		</g>);
	};
}