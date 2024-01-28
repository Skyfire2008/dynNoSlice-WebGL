namespace graph {

	type Interval = [number, number];

	export interface Network {
		nodes: Array<Node>;
		edges: Array<Edge>;
	}

	export interface Node {
		label: string;
		intervals: Array<Interval>;
	}

	export interface Edge {
		from: number;
		to: number;
		label?: string;
		intervals: Array<Interval>;
	}

	interface Color {
		r: number;
		g: number;
		b: number;
	}

	//TODO: move to a separate module
	const getEdgeId = (a: number, b: number) => {
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

	export class ExtNetwork implements Network {
		public nodes: Array<Node>;
		public edges: Array<Edge>;
		public startTime: number;
		public endTime: number;

		//TODO: add node trajectory data

		constructor(network: Network) {
			this.nodes = network.nodes;
			this.edges = network.edges;

			this.startTime = Number.POSITIVE_INFINITY;
			this.endTime = Number.NEGATIVE_INFINITY;
			for (const edge of network.edges) {
				//assume that all intervals are in order
				this.startTime = Math.min(this.startTime, edge.intervals[0][0]);
				this.endTime = Math.max(this.endTime, edge.intervals[edge.intervals.length - 1][1]);
			}

			//TODO: generate interval trees for nodes and edges
		}

		/**
		 * Updates node trajectory positions using data from texture
		 * @param buf data from positions texture
		 */
		public updatePositions(buf: Float32Array) {
			//TODO: implement
		}

		/**
		 * Generates a slice to be visualized
		 * @param time moment at which the timeslice occurs
		 */
		public toSlice(time: number) {
			//TODO: implement
		}

		/**
		 * Generates positions buffer
		 * @param timeStep time step at which new trajectory points are created
		 * @returns [buffer, dimensions]
		 */
		public genPositionsBuffer(timeStep: number): [Float32Array, math.Dims] {
			//data is stored as R: x, G: y, B: time
			//row Y stores trajectories of node Y
			const trajectories: Array<Array<Color>> = [];

			let width = 0;
			for (const node of this.nodes) {
				const trajectory: Array<Color> = [];
				const nodeX = Math.random();
				const nodeY = Math.random();

				for (const interval of node.intervals) {
					//subdivide each interval by time step
					let currentTime = interval[0];

					while (currentTime < interval[1]) {
						trajectory.push({ r: nodeX, g: nodeY, b: currentTime });
						currentTime += timeStep;
					}

					//interval end is skipped by loop, add it here
					trajectory.push({ r: nodeX, g: nodeY, b: currentTime });
				}

				trajectories.push(trajectory);
				//calculate new width, width is multiplied by 3 since every positions takes up 3 buffer elements
				width = Math.max(width, trajectory.length);
			}

			//write the arrays into the buffer
			const buffer = new Float32Array(3 * width * this.nodes.length);
			let rowStart = 0;
			for (const trajectory of trajectories) {
				let pos = 0;
				for (const point of trajectory) {
					buffer[rowStart + pos++] = point.r;
					buffer[rowStart + pos++] = point.g;
					buffer[rowStart + pos++] = point.b;
				}

				rowStart += 3 * width;
			}

			return [buffer, { width, height: this.nodes.length }];
		}


		/**
		 * Generates a buffer of intervals for every edge
		 * @returns interval buffer, map of edge ids to their positions in buffer
		 */
		public genIntervalsBuffer(): [Float32Array, Map<number, number>] {
			//if every row corresponds to a single edge, it will likely result in a texture that's too big for the GPU
			//lay out all intervals continuously and store the edges' indices

			const indMap = new Map<number, number>(); //maps edge id to its index in buffer
			const buffer: Array<number> = [];

			for (const edge of this.edges) {

				const id = getEdgeId(edge.from, edge.to);
				indMap.set(id, buffer.length / 2);

				for (const interval of edge.intervals) {
					buffer.push(interval[0]);
					buffer.push(interval[1]);
				}

				//push two zeros to denote end of edge's intervals
				//two zeros, since when represented as texture, every pixel will contain two values
				buffer.push(0, 0);
			}

			//TODO: calculate square root of length, turn the texture into a square with this side length, pad with zeroes
			return [new Float32Array(buffer), indMap];
		}

		/**
		 * Generates a buffer of eges' indices
		 * @param edgeIndexMap map edges' ids to starting positions of their intervals in intervals buffer(returned by genIntervalsBuffer)
		 * @returns 
		 */
		public genAdjacenciesBuffer(edgeIndexMap: Map<number, number>): [Uint16Array, math.Dims] {

			//first calculate the adjacency list
			const adjLists: Array<Array<number>> = [];

			for (const edge of this.edges) {
				let fromArray = adjLists[edge.from];
				if (fromArray == null) {
					fromArray = [];
					adjLists[edge.from] = fromArray;
				}
				fromArray.push(edge.to);

				let toArray = adjLists[edge.to];
				if (toArray == null) {
					toArray = [];
					adjLists[edge.to] = toArray;
				}
				toArray.push(edge.from);
			}

			const width = adjLists.reduce((prev, cur) => Math.max(prev, cur.length), 0) + 1;

			//now write them into the buffer
			const buffer = new Uint16Array(2 * width * this.nodes.length);
			for (let nodeId = 0; nodeId < this.nodes.length; nodeId++) {
				let pos = nodeId * width * 2
				const adjacencies = adjLists[nodeId];
				buffer[pos] = adjacencies.length; //write the length of the row(amount of adjacent nodes)
				pos += 2;

				for (const adjNodeId of adjacencies) {
					const edgeIndex = edgeIndexMap.get(getEdgeId(nodeId, adjNodeId));

					buffer[pos++] = adjNodeId;
					buffer[pos++] = edgeIndex;
				}
			}

			return [buffer, { width, height: this.nodes.length }];
		}
	}
}