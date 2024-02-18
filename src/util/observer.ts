namespace dynnoslice.util {

	type Sub<T> = (value: T) => {};

	export class Observer<T>{
		private value: T;
		private subscriptions: Array<Sub<T>>;

		constructor(value?: T) {
			this.value = value;
			this.subscriptions = [];
		}

		public set(value: T) {
			this.value = value;
			this.notifySubscribers();
		}
		public get() {
			return this.value;
		}

		public subscribe(sub: Sub<T>) {
			this.subscriptions.push(sub);
		}

		public unsubscribe(sub: Sub<T>) {
			const index = this.subscriptions.indexOf(sub);
			if (index >= 0) {
				this.subscriptions.splice(index, 1);
			}
		}

		public notifySubscribers() {
			for (const sub of this.subscriptions) {
				sub(this.value);
			}
		}
	}
}