// Seeded random number generator ported from EZ-Tree (MIT, Daniel Greenheck).
// The exact sequence matters: the same seed must give the same tree on every
// client and on the server.

const MASK = 0xffffffff

export class Rng {
  #w: number
  #z: number

  constructor(seed: number) {
    this.#w = (123456789 + seed) & MASK
    this.#z = (987654321 - seed) & MASK
  }

  /** Returns a number between min and max. */
  random(max: number = 1, min: number = 0): number {
    this.#z = (36969 * (this.#z & 65535) + (this.#z >> 16)) & MASK
    this.#w = (18000 * (this.#w & 65535) + (this.#w >> 16)) & MASK
    const result = (((this.#z << 16) + (this.#w & 65535)) >>> 0) / 4294967296
    return (max - min) * result + min
  }
}
