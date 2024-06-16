namespace graphics {

	export class Framebuffer {

		private fb: WebGLFramebuffer;
		public readonly width: number;
		public readonly height: number;
		public readonly texture: WebGLTexture;

		constructor(texture: WebGLTexture, width: number, height: number) {
			this.texture = texture;
			this.width = width;
			this.height = height;

			this.fb = gl.createFramebuffer();
			gl.bindFramebuffer(gl.FRAMEBUFFER, this.fb);
			gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.texture, 0);

			//check framebuffer status
			const status = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
			if (status != gl.FRAMEBUFFER_COMPLETE) {
				console.error("Framebuffer is incomplete, status", status);
			}

			gl.bindFramebuffer(gl.FRAMEBUFFER, null);
		}

		public static blit(source: Framebuffer, target: Framebuffer) {
			gl.bindFramebuffer(gl.READ_FRAMEBUFFER, source.fb);
			gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, target.fb);
			gl.blitFramebuffer(0, 0, source.width, source.height, 0, 0, source.width, source.height, gl.COLOR_BUFFER_BIT, gl.NEAREST);
			gl.bindFramebuffer(gl.READ_FRAMEBUFFER, null);
			gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, null);
		}

		public bind() {
			gl.bindFramebuffer(gl.FRAMEBUFFER, this.fb);
			gl.viewport(0, 0, this.width, this.height);
		}

		public dispose() {
			gl.deleteFramebuffer(this.fb);
		}
	}
}