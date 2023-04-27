namespace graphics {

	export var gl: WebGL2RenderingContext;

	export class Shader {

		private program: WebGLProgram;
		private static quad: Quad;

		public static init(gl: WebGL2RenderingContext) {
			graphics.gl = gl;
			Shader.quad = new Quad();
		}

		public static clear() {
			gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
		}

		public static loadShader(type: number, src: string): WebGLShader {
			const result = gl.createShader(type);
			gl.shaderSource(result, src);
			gl.compileShader(result);

			if (!gl.getShaderParameter(result, gl.COMPILE_STATUS)) {
				console.error(`Could not compile shader: ${gl.getShaderInfoLog(result)}`);
			}

			return result;
		}

		constructor(vertSrc: string, fragSrc: string, transformFeedbackVaryings?: Array<string>) {
			this.program = gl.createProgram();

			const vert = Shader.loadShader(gl.VERTEX_SHADER, vertSrc);
			const frag = Shader.loadShader(gl.FRAGMENT_SHADER, fragSrc);

			gl.attachShader(this.program, vert);
			gl.attachShader(this.program, frag);

			//if transform feedback varyings array set, enable transform feedback
			if (transformFeedbackVaryings != undefined) {
				gl.transformFeedbackVaryings(this.program, transformFeedbackVaryings, gl.SEPARATE_ATTRIBS);
			}

			gl.linkProgram(this.program);

			if (!gl.getProgramParameter(this.program, gl.LINK_STATUS)) {
				console.log("Error while linking the program: " + gl.getProgramInfoLog(this.program));
			}
		}

		public setBool(name: string, value: boolean) {
			gl.uniform1i(gl.getUniformLocation(this.program, name), value ? 1 : 0);
		}

		public setInt(name: string, value: number) {
			gl.uniform1i(gl.getUniformLocation(this.program, name), value);
		}

		public setFloat(name: string, value: number) {
			gl.uniform1f(gl.getUniformLocation(this.program, name), value);
		}

		public setVec3(name: string, value: math.Vec3) {
			gl.uniform3fv(gl.getUniformLocation(this.program, name), value.values);
		}

		public use() {
			gl.useProgram(this.program);
		}

		public drawShape(shape: Shape) {
			gl.bindVertexArray(shape.vao);
			gl.drawElements(gl.LINES, shape.indices.length, gl.UNSIGNED_SHORT, 0);
			gl.bindVertexArray(null);
		}

		public drawQuad(width: number, height: number) {
			gl.viewport(0, 0, width, height);
			gl.bindVertexArray(Shader.quad.vao);
			gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
			gl.bindVertexArray(null);
		}
	}
}