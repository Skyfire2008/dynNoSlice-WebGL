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
			let prevFinal = false;
			for (let i = 0; i < width * 4; i += 4) {

				//if current and previous points are final, the trajectory ended
				const final = positions[start + i + 3] == 0.0;
				if (final && prevFinal) {
					break;
				}

				trajectory.push({
					x: positions[start + i],
					y: positions[start + i + 1],
					t: positions[start + i + 2],
					final
				});

				prevFinal = final;
			}

			result.push(trajectory);
		}

		return result;
	}

	export const findPosition = (trajectory: Trajectory, time: number) => {
		const binSearch = (low: number, index: number, high: number): math.Vec2 => {
			const current = trajectory[index];
			const next = (index + 1) != trajectory.length ? trajectory[index + 1] : trajectory[index];

			//if timestamp is inside current interval...
			if (current.t <= time && time <= next.t) {
				if (current.final) {
					return null;
				} else {
					const interval = next.t - current.t;

					//special case when current is the final bend in trajectory
					if (interval <= 0) {
						return new math.Vec2([current.x, current.y]);
					}

					const mult = (time - current.t) / interval;
					const x = math.lerp(current.x, next.x, mult);
					const y = math.lerp(current.y, next.y, mult);
					return new math.Vec2([x, y]);
				}
			} else {
				if (time < current.t) {
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
		};

		return binSearch(0, Math.floor(trajectory.length / 2), trajectory.length);
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