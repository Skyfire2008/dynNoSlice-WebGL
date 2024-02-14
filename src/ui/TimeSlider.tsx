namespace dynnoslice.ui {

	interface TimeSliderProps {
		min: number;
		max: number;
		value: number;
		onChange: (value: number) => void;
	}

	export const TimeSlider: React.FC<TimeSliderProps> = ({ min, max, value, onChange }) => {

		const [tempValue, setTempValue] = React.useState(value);
		const frameId = React.useRef(0);

		const inputStep = React.useMemo(() => {
			return (max - min) / 1280;
		}, [min, max]);

		const onInput = (e: React.ChangeEvent<HTMLInputElement>) => {
			let num = Number.parseFloat(e.target.value);
			num = isNaN(num) ? 0 : num;
			num = Math.min(Math.max(num, min), max);
			setTempValue(num)
		};

		//synchronize timestamp update with frame change
		React.useEffect(() => {
			frameId.current = requestAnimationFrame(() => {
				onChange(tempValue);
			});
			return () => { cancelAnimationFrame(frameId.current); };
		}, [tempValue]);

		return (
			<div>
				<input type="range" step="any" min={min} max={max} value={value} onChange={(e) => {
					const newValue = parseFloat((e.target as HTMLInputElement).value);
					setTempValue(newValue);
				}} style={{ width: "1280px" }}></input>
				<input type="number" min={min} max={max} value={value} step={inputStep} onChange={onInput}></input>
			</div>
		);
	};
}
