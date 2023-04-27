namespace graphics {

	export class Shape {
		public readonly indices: Uint16Array;
		public readonly colors: Float32Array;
		public readonly positions: Float32Array;

		public vao: WebGLVertexArrayObject;
		public indVbo: WebGLBuffer;
		public colorVbo: WebGLBuffer;

		constructor(indices: Uint16Array, colors: Float32Array, positions: Float32Array) {
			this.indices = indices;
			this.colors = colors;
			this.positions = positions;

			//create VAO
			this.vao = gl.createVertexArray();
			gl.bindVertexArray(this.vao);

			//create color VBO
			this.colorVbo = gl.createBuffer();
			gl.bindBuffer(gl.ARRAY_BUFFER, this.colorVbo);
			gl.bufferData(gl.ARRAY_BUFFER, this.colors, gl.STATIC_DRAW);
			gl.enableVertexAttribArray(0);
			gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 0, 0);

			//create index VBO
			this.indVbo = gl.createBuffer();
			gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indVbo);
			gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, this.indices, gl.STATIC_DRAW);

			gl.bindVertexArray(null);
		}

		public dispose() {
			gl.deleteBuffer(this.colorVbo);
			gl.deleteBuffer(this.indVbo);
			gl.deleteVertexArray(this.vao);
		}

	}
}