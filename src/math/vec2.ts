namespace math {

	/**
	 * Two-dimensional vector
	 */
	export class Vec2 {
		readonly values: [number, number];

		public static diff(A: Vec2, B: Vec2): Vec2 {
			return new Vec2([A.x - B.x, A.y - B.y]);
		}

		public static dot(A: Vec2, B: Vec2): number {
			return A.x * B.x + A.y * B.y;
		}

		public static scale(A: Vec2, m: number): Vec2 {
			return new Vec2([A.x * m, A.y * m]);
		}

		public static sum(A: Vec2, B: Vec2): Vec2 {
			return new Vec2([A.x + B.x, A.y + B.y]);
		}

		constructor(values: [number, number]) {
			this.values = values;
		}

		public clone(): Vec2 {
			return new Vec2([this.x, this.y]);
		}

		public set(x: number, y: number) {
			this.x = x;
			this.y = y;
		}

		public add(other: Vec2) {
			this.x += other.x;
			this.y += other.y;
		}

		public mult(m: number) {
			this.x *= m;
			this.y *= m;
		}

		public length(): number {
			return Math.sqrt(this.x * this.x + this.y * this.y);
		}

		public normalize() {
			const length = this.length();
			this.x /= length;
			this.y /= length;
		}

		get x(): number {
			return this.values[0];
		}
		set x(value: number) {
			this.values[0] = value;
		}

		get y(): number {
			return this.values[1];
		}
		set y(value: number) {
			this.values[1] = value;
		}
	}
}
