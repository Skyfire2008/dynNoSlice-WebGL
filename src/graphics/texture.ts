namespace graphics {

	export class Texture {

		public readonly id: WebGLTexture;
		public readonly width: number;
		public readonly height: number;
		public readonly internalFormat: number;

		private static makeTexture(width: number, height: number, data: ArrayBufferView, internalFormat: number): Texture {
			const id = gl.createTexture();
			gl.bindTexture(gl.TEXTURE_2D, id);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

			//select proper format and type based on internalFormat
			let format: number = null;
			let type: number = null;
			switch (internalFormat) {
				case gl.RGBA32F: //positions: 3 channels, alpha is not used, 4 bytes each, float
					format = gl.RGBA;
					type = gl.FLOAT;
					break;
				case gl.RGB32F:
					console.log("RGB32F is not color renderable, do not use for positions");
					format = gl.RGB;
					type = gl.FLOAT;
					break;
				case gl.RG32F: //intervals: 2 channels, 4 bytes each, float
					format = gl.RG;
					type = gl.FLOAT;
					break;
				case gl.RG16UI: //adjacencies: 2 channels, 2 bytes each, unsigned int
					format = gl.RG_INTEGER;
					type = gl.UNSIGNED_SHORT;
					break;
			}

			gl.texImage2D(gl.TEXTURE_2D, 0, internalFormat, width, height, 0, format, type, data);

			return new Texture(id, width, height, internalFormat);
		}

		/**
		 * Creates a texture to store intervals in which nodes appear
		 * @param data 
		 * @returns 
		 */
		public static makeIntervalsTexture(width: number, height: number, data: Float32Array) {
			return Texture.makeTexture(width, height, data, gl.RG32F);
		}

		/**
		 * Creates a texture to store the node adjancencies
		 * @param width texture width: max number of adjacent nodes per node
		 * @param height texture height: number of nodes
		 * @param data positions in a fixed type array
		 * @returns texture
		 */
		public static makeAdjacenciesTexture(width: number, height: number, data: Uint16Array) {
			return Texture.makeTexture(width, height, data, gl.RG16UI);
		}

		/**
		 * Creates a texture to store the position of nodes' trajectory points
		 * @param width texture width: max number of trajectory points per node
		 * @param height texture height: number of nodes
		 * @param data positions in a fixed type array
		 * @returns texture
		 */
		public static makePositionTexture(width: number, height: number, data: Float32Array) {
			return Texture.makeTexture(width, height, data, gl.RGBA32F);
		}

		private constructor(id: WebGLTexture, width: number, height: number, internalFormat: number) {
			this.id = id;
			this.width = width;
			this.height = height;
			this.internalFormat = internalFormat;
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
