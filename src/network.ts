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

		//TODO: move to a separate module
		public static getEdgeId(a: number, b: number) {
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
		 * Generate positions 
		 * @param timeStep time step at which new trajectory points are created
		 * @returns [buffer, width, height]
		 */
		private genPositionsBuffer(timeStep: number): [Float32Array, number, number] {
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

			return [buffer, width, this.nodes.length];
		}

		private genIntervalsBuffer(): [Float32Array, Map<number, number>] {
			//if every row corresponds to a single edge, it will likely result in a texture that's too big for the GPU
			//lay out all intervals continuously and store the edges' indices

			const indMap = new Map<number, number>(); //maps edge id to its index in buffer

			//calculate the buffer length first
			let length = 0;
			for (const edge of this.edges) {
				const id = ExtNetwork.getEdgeId(edge.from, edge.to);
				indMap.set(id, length);
				length += 2 + edge.intervals.length * 2;
			}

			//now write the data
			const buffer = new Float32Array(length);
			let pos = 0;
			for (const edge of this.edges) {
				for (const interval of edge.intervals) {
					buffer[pos++] = interval[0];
					buffer[pos++] = interval[1];
				}

				buffer[pos++] = 0;
				buffer[pos++] = 0; //[0, 0] denotes the end of edge
			}

			return [buffer, indMap];
		}

		private genAdjacenciesBuffer(): Uint16Array {

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

			//TODO: there's a non-zero chance that adjacency texture elements will also have to refer to interval texture
			const width = adjLists.reduce((prev, cur) => Math.max(prev, cur.length), 0);


			return null;
		}
	}

	/*export const toShapes = (net: Network): [Array<graphics.Shape>, graphics.Texture, graphics.Texture] => {
		const shapes: Array<graphics.Shape> = [];

		let width = 0;
		for (const layer of net.layers) {
			width = Math.max(width, layer.nodes.length);
		}
		const texture = new Float32Array(width * 2 * net.layers.length);

		const presenceTextureWidth = Math.ceil(width / 8);
		const presenceTexture = new Int8Array(presenceTextureWidth * net.layers.length);
		const setPresence = (layer: number, index: number) => {
			const start = Math.floor(index / 8);
			const value = 1 << (index - start * 8);
			presenceTexture[layer * presenceTextureWidth + start] = presenceTexture[layer * presenceTextureWidth + start] | value;
		}

		let textureOffset = 0;
		for (let j = 0; j < net.layers.length; j++) {
			const layer = net.layers[j];
			const nodeMap: Array<number> = []; //maps node id to its index in node array
			const colors = new Float32Array(layer.nodes.length * 3);
			const positions = new Float32Array(layer.nodes.length * 2);
			const indices = new Uint16Array(layer.edges.length * 2);

			for (let i = 0; i < layer.nodes.length; i++) {
				const node = layer.nodes[i];
				nodeMap[node] = i;
				nodeMap.push(node);

				const color = [0, 0, 0];
				color[node % 3] = 1;

				colors[i * 3] = color[0];
				colors[i * 3 + 1] = color[1];
				colors[i * 3 + 2] = color[2];

				positions[i * 2] = Math.random() * 2 - 1;
				positions[i * 2 + 1] = Math.random() * 2 - 1;

				texture[textureOffset + node * 2] = positions[i * 2];
				texture[textureOffset + node * 2 + 1] = positions[i * 2 + 1];

				setPresence(j, node);
			}

			for (let i = 0; i < layer.edges.length; i++) {
				const edge = layer.edges[i];
				indices[i * 2] = nodeMap[edge.from];
				indices[i * 2 + 1] = nodeMap[edge.to];
			}

			textureOffset += width * 2;
			shapes.push(new graphics.Shape(indices, colors, positions));
		}

		return [shapes, graphics.Texture.makePositionTexture(width, net.layers.length, texture), graphics.Texture.makeBoolTexture(presenceTextureWidth, net.layers.length, presenceTexture)];
	};*/
}