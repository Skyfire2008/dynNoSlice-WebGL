namespace math {

	export class Vec3 {
		readonly values: [number, number, number];

		public static diff(A: Vec3, B: Vec3): Vec3 {
			return new Vec3([A.x - B.x, A.y - B.y, A.z - B.z]);
		}

		public static cross(A: Vec3, B: Vec3): Vec3 {
			const x = A.y * B.z - A.z * B.y;
			const y = A.z * B.x - A.x * B.z;
			const z = A.x * B.y - A.y * B.x;

			return new Vec3([x, y, z]);
		}

		public static dot(A: Vec3, B: Vec3): number {
			return A.x * B.x + A.y * B.y + A.z * B.z;
		}

		public static scale(A: Vec3, m: number): Vec3 {
			return new Vec3([A.x * m, A.y * m, A.z * m]);
		}

		public static sum(A: Vec3, B: Vec3): Vec3 {
			return new Vec3([A.x + B.x, A.y + B.y, A.z + B.z]);
		}

		constructor(values: [number, number, number]) {
			this.values = values;
		}

		public clone(): Vec3 {
			return new Vec3([this.x, this.y, this.z]);
		}

		public set(x: number, y: number, z: number) {
			this.x = x;
			this.y = y;
			this.z = z;
		}

		public add(other: Vec3) {
			this.x += other.x;
			this.y += other.y;
			this.z += other.z;
		}

		public mult(m: number) {
			this.x *= m;
			this.y *= m;
			this.z *= m;
		}

		public length(): number {
			return Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z);
		}

		public normalize() {
			const length = this.length();
			this.x /= length;
			this.y /= length;
			this.z /= length;
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

		get z(): number {
			return this.values[2];
		}
		set z(value: number) {
			this.values[2] = value;
		}
	}
}
