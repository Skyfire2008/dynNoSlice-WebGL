namespace graphics {

	export class Quad {
		public vao: WebGLVertexArrayObject;
		public posVbo: WebGLBuffer;
		public uvVbo: WebGLBuffer;

		constructor() {
			const positions: Array<number> = [
				-1.0, 1.0,
				-1.0, -1.0,
				1.0, 1.0,
				1.0, -1.0
			];
			const uvs: Array<number> = [
				0, 1,
				0, 0,
				1, 1,
				1, 0
			];

			this.vao = gl.createVertexArray();
			gl.bindVertexArray(this.vao);

			//create positions VBO
			this.posVbo = gl.createBuffer();
			gl.bindBuffer(gl.ARRAY_BUFFER, this.posVbo);
			gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);
			gl.enableVertexAttribArray(0);
			gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

			//create uv VBO
			this.uvVbo = gl.createBuffer();
			gl.bindBuffer(gl.ARRAY_BUFFER, this.uvVbo);
			gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(uvs), gl.STATIC_DRAW);
			gl.enableVertexAttribArray(1);
			gl.vertexAttribPointer(1, 2, gl.FLOAT, false, 0, 0);
		}

		public dispose() {
			gl.deleteBuffer(this.posVbo);
			gl.deleteBuffer(this.uvVbo);
			gl.deleteVertexArray(this.vao);
		}
	}
}