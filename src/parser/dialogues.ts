//TODO: split backend and frontend source files into two folder with separate tsconfig.json files for each
namespace parser {

	interface Edge {
		from: number;
		to: number;
		start: number;
		end: number;
	}

	interface Network {
		nodes: Array<string>;
		edges: Array<Edge>;
	}
}