namespace dynnoslice.ui {

	export interface GraphNodeProps {
		label: string;
		pos: math.Vec2;
		/**
		 * DOMRect of <text> calculated during one of previous render passes
		 */
		savedTextBox: DOMRect;
		/**
		 * Callback function to set text bounding box in GraphSvg
		 * @param textBox text element's bounding box
		 */
		textBoxCallback: (textBox: DOMRect) => void;
	}

	export const GraphNode: React.FC<GraphNodeProps> = ({ label, pos, savedTextBox, textBoxCallback }) => {
		const textRef = React.useRef<SVGTextElement>(null);
		const [calculatedTextBox, setCalculatedTextBox] = React.useState<DOMRect>(null);

		const textBox = React.useMemo(() => {
			//select the proper textBox value to set the reacntagle's width and height
			if (savedTextBox == null) {
				if (calculatedTextBox == null) {
					return new DOMRect(0, 0, 0, 0);
				} else {
					return calculatedTextBox;
				}
			} else {
				return savedTextBox;
			}
		}, [calculatedTextBox, savedTextBox]);

		React.useEffect(() => {
			//if text box not saved for this label, calculate and save it
			if (savedTextBox == null) {
				const textBox = textRef.current.getBBox();
				textBoxCallback(textBox);
				setCalculatedTextBox(textBox);
			}
		}, [label]);

		return (<g transform={`translate(${pos.x - textBox.width / 2}, ${pos.y - textBox.height / 2})`}>
			<rect width={textBox.width} height={textBox.height} fill="white" stroke="black"></rect>
			<text ref={textRef} transform={`translate(${-textBox.x}, ${-textBox.y})`}>{label}</text>
		</g>);
	};
}