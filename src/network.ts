namespace dynnoslice {
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
}