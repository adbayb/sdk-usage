import { once } from "node:events";
import { Readable } from "node:stream";

type Producer<Value> = (
	emit: (value: Value) => Promise<void>,
	signal: AbortSignal,
) => Promise<void>;

// Node uses null, not undefined, to signal end-of-stream.

// oxlint-disable-next-line unicorn/no-null
const endOfStream = null;

class ObjectReadable<Value> extends Readable {
	readonly #controller = new AbortController();

	#readVersion = 0;

	public constructor(produce: Producer<Value>) {
		super({ objectMode: true });

		queueMicrotask(() => {
			void this.#produce(produce);
		});
	}

	/*
	 * Node requires this callback to complete stream destruction.
	 */
	// oxlint-disable-next-line promise/prefer-await-to-callbacks
	public override _destroy(error: Error | null, callback: (error?: Error | null) => void) {
		this.#controller.abort();
		this.emit("producer-read");
		// oxlint-disable-next-line promise/prefer-await-to-callbacks
		callback(error);
	}

	public override _read() {
		this.#readVersion += 1;
		this.emit("producer-read");
	}

	async #emitValue(value: Value) {
		this.#controller.signal.throwIfAborted();

		const readVersion = this.#readVersion;

		if (!this.push(value)) {
			if (!this.destroyed && this.#readVersion === readVersion) {
				await once(this, "producer-read");
			}

			this.#controller.signal.throwIfAborted();
		}
	}

	async #produce(produce: Producer<Value>) {
		try {
			await produce(this.#emitValue.bind(this), this.#controller.signal);

			if (!this.destroyed) {
				this.push(endOfStream);
			}
		} catch (error) {
			if (!this.#controller.signal.aborted) {
				this.destroy(error instanceof Error ? error : new Error(String(error)));
			}
		}
	}
}

export const createObjectStream = <Value>(
	produce: Producer<Value>,
): AsyncIterable<Value> & Omit<Readable, typeof Symbol.asyncIterator> => {
	// Readable object mode exposes an untyped async iterator in Node's declarations.
	return new ObjectReadable(produce) as AsyncIterable<Value> &
		Omit<Readable, typeof Symbol.asyncIterator>;
};
