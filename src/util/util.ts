namespace dynnoslice.util {

	/**
	 * Generates a unique id for edge given ids of nodes it connects
	 * @param a	node id
	 * @param b node id
	 * @returns 
	 */
	export const getEdgeId = (a: number, b: number) => {
		let min, max;
		if (a < b) {
			min = a;
			max = b;
		} else {
			min = b;
			max = a;
		}

		const triNum = max * (max + 1) / 2;
		return triNum + min;
	};

	/**
	 * Finds the interval at given timestamp
	 * @param intervals sorted array of intervals
	 * @param time time stamp
	 * @returns if found, interval, otherwise null
	 */
	export const findInterval = (intervals: Array<Interval>, time: number) => {

		/**
		 * Performs recursive binary search
		 * @param low lower border
		 * @param index current index
		 * @param high higher border
		 */
		const binSearch = (low: number, index: number, high: number) => {

			const current = intervals[index];
			console.log(low, index, high, current);

			if (current[0] <= time && time < current[1]) {
				return current;
			} else {
				if (time < current[0]) {
					const newIndex = Math.floor((low + index) / 2);
					if (newIndex != index) {
						return binSearch(low, newIndex, index);
					} else {
						return null;
					}
				} else {
					const newIndex = Math.floor((index + high) / 2);
					if (newIndex != index) {
						return binSearch(index, newIndex, high);
					} else {
						return null;
					}
				}
			}
		}

		return binSearch(0, Math.floor(intervals.length / 2), intervals.length);
	}
}