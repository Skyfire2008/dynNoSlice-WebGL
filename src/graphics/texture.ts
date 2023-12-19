namespace graphics {

	export class Texture {

		public readonly id: WebGLTexture;
		public readonly width: number;
		public readonly height: number;

		public static makeBoolTexture(width: number, height: number, data: Int8Array) {
			const id = gl.createTexture();
			gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
			gl.bindTexture(gl.TEXTURE_2D, id);
			gl.texImage2D(gl.TEXTURE_2D, 0, gl.R8I, width, height, 0, gl.RED_INTEGER, gl.BYTE, data);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

			gl.bindTexture(gl.TEXTURE_2D, null);
			gl.pixelStorei(gl.UNPACK_ALIGNMENT, 4);
			return new Texture(id, width, height);
		}

		/**
		 * Creates a texture to store the position of nodes' trajctory points
		 * @param width texture width: max number of trajecotry points
		 * @param height number of nodes
		 * @param data positions in a fixed type array
		 * @returns texture
		 */
		public static makePositionTexture(width: number, height: number, data: Float32Array) {
			const id = gl.createTexture();
			gl.bindTexture(gl.TEXTURE_2D, id);
			gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB32F, width, height, 0, gl.RGB, gl.FLOAT, data);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

			gl.bindTexture(gl.TEXTURE_2D, null);
			return new Texture(id, width, height);
		}

		private constructor(id: WebGLTexture, width: number, height: number) {
			this.id = id;
			this.width = width;
			this.height = height;
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
