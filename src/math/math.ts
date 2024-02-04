namespace math {

	/**
	 * 2d dimensions
	 */
	export interface Dims {
		width: number;
		height: number;
	}

	export const lerp = (a: number, b: number, mult: number) => {
		return a * (1 - mult) + b * mult;
	};
}