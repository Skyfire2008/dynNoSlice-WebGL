namespace graphics {

	export class PositionTexture {

		public id: WebGLTexture;
		public readonly width: number;
		public readonly height: number;
		public readonly data: Float32Array;

		constructor(width: number, height: number, data: Float32Array) {
			this.width = width;
			this.height = height;
			this.data = data;
		}

		public init() {
			this.id = gl.createTexture();
			gl.bindTexture(gl.TEXTURE_2D, this.id);
			gl.texImage2D(gl.TEXTURE_2D, 0, gl.RG32F, this.width, this.height, 0, gl.RG, gl.FLOAT, this.data);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

			gl.bindTexture(gl.TEXTURE_2D, null);
		}

		public bind(unit: number) {
			gl.activeTexture(unit);
			gl.bindTexture(gl.TEXTURE_2D, this.id);
		}

		public dispose() {
			gl.deleteTexture(this.id);
		}
	}
}
