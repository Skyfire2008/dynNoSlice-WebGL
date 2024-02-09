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

	export type Trajectory = Array<{ x: number, y: number, t: number, final: boolean }>;

	/**
	 * Converts position buffer into an array of node trajectories
	 * @param positions position buffer
	 * @param width width of position texture
	 * @returns 
	 */
	export const getTrajectories = (positions: Float32Array, width: number): Array<Trajectory> => {
		const result: Array<Trajectory> = [];

		for (let start = 0; start < positions.length; start += width * 4) {
			const trajectory: Trajectory = [];
			for (let i = 0; i < width * 4; i += 4) {
				trajectory.push({
					x: positions[start + i],
					y: positions[start + i + 1],
					t: positions[start + i + 2],
					final: positions[start + i + 3] == 0.0
				});
			}

			result.push(trajectory);
		}

		return result;
	}

	/**
	 * Finds the position of given node in positions buffer at given time
	 * @param positions positions buffer
	 * @param width width of texture for positions buffer
	 * @param id node id
	 * @param time time stamp
	 */
	export const findPosition = (positions: Float32Array, width: number, id: number, time: number): math.Vec2 => {

		const binSearch = (low: number, index: number, high: number): math.Vec2 => {

			//console.log(low, index, high);

			//memory layout in positions buffer: x, y, time, padding
			const t0ind = index * 4 + 2;
			const t1ind = t0ind + 4;

			//if next time is lower than current, we've reached the end of trajectory, move back
			//TODO: probably won't work in all cases
			if (positions[t0ind] >= positions[t1ind]) {
				return binSearch(low, Math.floor((low + index) / 2), index);
			}

			if (positions[t0ind] <= time && time <= positions[t1ind]) {

				//linearly interpolate between positions in interval
				const total = positions[t1ind] - positions[t0ind];
				const mult = (time - positions[t0ind]) / total;
				const x = math.lerp(positions[index * 4], positions[(index + 1) * 4], mult);
				const y = math.lerp(positions[index * 4 + 1], positions[(index + 1) * 4 + 1], mult);

				return new math.Vec2([x, y]);
			} else {
				if (time < positions[t0ind]) {
					return binSearch(low, Math.floor((low + index) / 2), index);
				} else {
					return binSearch(index, Math.floor((index + high) / 2), high);
				}
			}
		};

		let low = id * width;
		let high = (id + 1) * width;
		let index = Math.floor((low + high) / 2);

		//trajectory not always takes up the whole length low->high, in which case time is 0
		//TODO: this will not work in all cases, instead save how many points a trajectory has been split when generating it
		while (positions[index * 4 + 2] == 0) {
			high = index;
			index = Math.floor((low + high) / 2);
		}

		return binSearch(low, index, high);
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