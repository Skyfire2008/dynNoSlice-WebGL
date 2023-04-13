namespace graph {
	export interface Network {
		layers: Array<Layer>;
	}

	export interface Layer {
		nodes: Array<number>;
		edges: Array<Edge>;
	}

	export interface Edge {
		from: number;
		to: number;
		label: string;
	}

	export const toShapes = (net: Network): Array<graphics.Shape> => {
		const result: Array<graphics.Shape> = [];

		for (const layer of net.layers) {
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

				positions[i * 2] = Math.random();
				positions[i * 2 + 1] = Math.random();
			}

			for (let i = 0; i < layer.edges.length; i++) {
				const edge = layer.edges[i];
				indices[i * 2] = nodeMap[edge.from];
				indices[i * 2 + 1] = nodeMap[edge.to];
			}

			result.push(new graphics.Shape(indices, colors, positions));
		}

		return result;
	};
}