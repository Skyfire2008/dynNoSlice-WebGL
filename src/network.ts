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

	class ExtNetwork implements Network {
		public nodes: Array<Node>;
		public edges: Array<Edge>;
		//TODO: add node trajectory data

		constructor(network: Network) {
			this.nodes = network.nodes;
			this.edges = network.edges;
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
		 * Generate positions 
		 * @param timeStep time step at which new trajectory points are created
		 * @returns [buffer, width, height]
		 */
		public genPositionsBuffer(timeStep: number): [Float32Array, number, number] {
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