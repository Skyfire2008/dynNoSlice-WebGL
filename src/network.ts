namespace dynnoslice {

	export type Interval = [number, number];

	export interface Network {
		nodes: Array<InputNode | OutputNode>;
		edges: Array<Edge>;
	}

	export interface InputNode {
		label: string;
		intervals: Array<Interval>;
	}

	export interface Edge {
		from: number;
		to: number;
		label?: string;
		intervals: Array<Interval>;
	}

	export interface OutputNode {
		label: string;
		trajectories: Array<Array<{ x: number, y: number, t: number }>>;
	}

	export interface OutputNetwork {
		nodes: Array<OutputNode>;
		edges: Array<Edge>;
	}

	interface Color {
		r: number;
		g: number;
		b: number;
		a: number;
	}

	interface Node extends InputNode {
		trajectories?: Array<Array<{ x: number, y: number, t: number }>>;
	}

	export class ExtNetwork {
		public nodes: Array<Node>;
		public edges: Array<Edge>;
		public startTime: number;
		public endTime: number;
		public readonly hasExistingLayout: boolean;

		constructor(network: Network) {

			//if has existing layout, intervals are not provided, calculate them
			this.hasExistingLayout = (network.nodes[0] as OutputNode).trajectories != null;
			if (this.hasExistingLayout) {
				this.nodes = [];
				for (const node of network.nodes) {
					const intervals: Array<Interval> = [];
					for (const trajectory of (node as OutputNode).trajectories) {
						intervals.push([trajectory[0].t, trajectory[trajectory.length - 1].t]);
					}
					this.nodes.push({ label: node.label, intervals, trajectories: (node as OutputNode).trajectories });
				}
			} else {
				this.nodes = (network.nodes as Array<InputNode>);
			}

			this.edges = network.edges;

			this.startTime = Number.POSITIVE_INFINITY;
			this.endTime = Number.NEGATIVE_INFINITY;
			for (const edge of network.edges) {
				//assume that all intervals are in order
				this.startTime = Math.min(this.startTime, edge.intervals[0][0]);
				this.endTime = Math.max(this.endTime, edge.intervals[edge.intervals.length - 1][1]);
			}
		}

		/**
		 * Generates positions buffer
		 * @param timeStep time step at which new trajectory points are created
		 * @param useSharedMemory if set to true will allocate and return a SharedArrayBuffer
		 * @param useExistingLayout if network had a layout already, will use it
		 * @returns [buffer, dimensions]
		 */
		public genPositionsBuffer(timeStep: number, useSharedMemory: boolean, useExistingLayout: boolean): [Float32Array, math.Dims] {

			//data is stored as R: x, G: y, B: time, A: 0.0 if point is final in trajectory segment, 1.0 otherwise
			//row Y stores trajectories of node Y
			const trajectories: Array<Array<Color>> = [];
			let width = 0;

			if (useExistingLayout) { //assume that grpah has existing layout
				for (const node of this.nodes) {
					const result: Array<Color> = [];

					//flatten all trajectory parts into one array
					for (const trajectory of node.trajectories) {
						for (let i = 0; i < trajectory.length; i++) {
							const point = trajectory[i];
							const a = (i == trajectory.length - 1) ? 0.0 : 1.0;
							result.push({ r: point.x, g: point.y, b: point.t, a });
						}
					}

					trajectories.push(result);
					width = Math.max(width, result.length);
				}
			} else {

				for (let i = 0; i < this.nodes.length; i++) {
					const node = this.nodes[i];
					const trajectory: Array<Color> = [];
					let nodeX = Math.random() - 0.5;
					let nodeY = Math.random() - 0.5;

					//INFO: debug
					/*if (i == 0) {
						nodeX = 0;
						nodeY = 0;
					} else if (i == 1) {
						nodeX = 1;
						nodeY = 0;
					} else if (i == 2) {
						nodeX = 1;
						nodeY = 1;
					} else if (i == 3) {
						nodeX = 0;
						nodeY = 1;
					}*/

					for (const interval of node.intervals) {
						//subdivide each interval by time step
						let currentTime = interval[0];

						while (currentTime < interval[1]) {
							trajectory.push({ r: nodeX, g: nodeY, b: currentTime, a: 1.0 });
							currentTime += timeStep;
						}

						//interval end is skipped by loop, add it here
						trajectory.push({ r: nodeX, g: nodeY, b: interval[1], a: 0.0 });
					}

					trajectories.push(trajectory);
					//calculate new width
					width = Math.max(width, trajectory.length);
				}
			}

			//write the arrays into the buffer
			let buffer: Float32Array = null;
			if (useSharedMemory) {
				const memory = new SharedArrayBuffer(4 * width * this.nodes.length * Float32Array.BYTES_PER_ELEMENT);
				buffer = new Float32Array(memory);
			} else {
				buffer = new Float32Array(4 * width * this.nodes.length);
			}

			let rowStart = 0;
			for (const trajectory of trajectories) {
				let pos = 0;
				for (const point of trajectory) {
					buffer[rowStart + pos++] = point.r;
					buffer[rowStart + pos++] = point.g;
					buffer[rowStart + pos++] = point.b;
					buffer[rowStart + pos++] = point.a;
				}

				rowStart += 4 * width;
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

				const id = util.getEdgeId(edge.from, edge.to);
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
		 * Generates a buffer of edges' indices
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
					const edgeIndex = edgeIndexMap.get(util.getEdgeId(nodeId, adjNodeId));

					buffer[pos++] = adjNodeId;
					buffer[pos++] = edgeIndex;
				}
			}

			return [buffer, { width, height: this.nodes.length }];
		}

		/**
		 * Generates new adjacencies buffer, containing adjacent nodes along with intervals
		 * @returns [new adjacencies buffer; dimensions of texture for buffer]
		 */
		public genNewAdjacenciesBuffer(): [Float32Array, math.Dims] {

			type Adjacency = { node: number, start: number, end: number };

			//first calculate the adjacency list
			const adjLists: Array<Array<Adjacency>> = [];

			for (const edge of this.edges) {
				let fromArray = adjLists[edge.from];
				if (fromArray == null) {
					fromArray = [];
					adjLists[edge.from] = fromArray;
				}

				let toArray = adjLists[edge.to];
				if (toArray == null) {
					toArray = [];
					adjLists[edge.to] = toArray;
				}

				//a new element is added for every interval
				for (const interval of edge.intervals) {
					fromArray.push({
						node: edge.to,
						start: interval[0],
						end: interval[1]
					});
					toArray.push({
						node: edge.from,
						start: interval[0],
						end: interval[1]
					});
				}
			}

			//calculate texture dimensions
			let width = 0;
			for (const list of adjLists) {
				//skip nodes with no adjacencies
				if (list == null) {
					continue;
				}

				width = Math.max(width, list.length);
			}
			width += 1;//1 extra cell for list length
			const dims: math.Dims = { width, height: adjLists.length };

			//write the buffer
			const buf = new Float32Array(dims.width * dims.height * 4);
			let i = 0;
			for (const list of adjLists) {
				//set 0 as adjacency length for empty lists and skip
				if (list == null) {
					buf[i] = 0;
					i += 4 * (width - 1);
					continue;
				}

				buf[i] = list.length;
				i += 4;
				for (const adj of list) {
					buf[i] = adj.node;
					buf[i + 1] = adj.start;
					buf[i + 2] = adj.end;
					i += 4;
				}
				i += 4 * (width - list.length - 1);
			}

			return [buf, dims];
		}
	}
}