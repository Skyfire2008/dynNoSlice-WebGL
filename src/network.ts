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

	export const toShapes = (net: Network): [Array<graphics.Shape>, graphics.PositionTexture] => {
		const shapes: Array<graphics.Shape> = [];

		let width = 0;
		for (const layer of net.layers) {
			width = Math.max(width, layer.nodes.length);
		}
		const texture = new Float32Array(width * 2 * net.layers.length);

		let textureOffset = 0;
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

				texture[textureOffset + node * 2] = positions[i * 2];
				texture[textureOffset + node * 2 + 1] = positions[i * 2 + 1];
			}

			for (let i = 0; i < layer.edges.length; i++) {
				const edge = layer.edges[i];
				indices[i * 2] = nodeMap[edge.from];
				indices[i * 2 + 1] = nodeMap[edge.to];
			}

			textureOffset += width * 2;
			shapes.push(new graphics.Shape(indices, colors, positions));
		}

		return [shapes, new graphics.PositionTexture(width, net.layers.length, texture)];
	};
}