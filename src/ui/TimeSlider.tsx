namespace dynnoslice.ui {

	interface TimeSliderProps {
		min: number;
		max: number;
		value: number;
		onChange: (value: number) => void;
	}

	export const TimeSlider: React.FC<TimeSliderProps> = ({ min, max, value, onChange }) => {
		return (
			<div>
				<input type="range" step="any" min={min} max={max} value={value} onChange={(e) => {
					const newValue = parseFloat((e.target as HTMLInputElement).value);
					onChange(newValue);
				}} style={{ width: "1280px" }}></input>
			</div>
		);
	};
}
