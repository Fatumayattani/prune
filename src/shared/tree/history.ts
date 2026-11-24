// The player's cuts for one puzzle, with undo. Shared so the server can
// apply the same rules when it checks a submitted solution.

import {removedBranches} from './cut.ts'
import type {TreeModel} from './model.ts'

export class CutHistory {
  readonly model: TreeModel
  #cuts: number[] = []
  #removed = new Set<number>()

  constructor(model: TreeModel, cuts: readonly number[] = []) {
    this.model = model
    for (const cut of cuts) this.cut(cut)
  }

  get cuts(): readonly number[] {
    return this.#cuts
  }

  get removed(): ReadonlySet<number> {
    return this.#removed
  }

  /** The trunk can't be cut, and neither can a branch that's already gone. */
  canCut(branchId: number): boolean {
    const branch = this.model.branches[branchId]
    if (!branch || branch.parent === undefined) return false
    return !this.#removed.has(branchId)
  }

  /** Cuts a branch. Returns false if the cut isn't allowed. */
  cut(branchId: number): boolean {
    if (!this.canCut(branchId)) return false
    this.#cuts.push(branchId)
    this.#removed = removedBranches(this.model, this.#cuts)
    return true
  }

  /** Undoes the last cut. Returns the branch that was restored. */
  undo(): number | undefined {
    const restored = this.#cuts.pop()
    this.#removed = removedBranches(this.model, this.#cuts)
    return restored
  }
}
