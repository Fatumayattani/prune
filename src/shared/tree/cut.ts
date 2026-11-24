// Cutting logic. A cut removes a branch and everything growing from it.
// Shared so the client and the server agree on what a cut removes.

import type {TreeModel} from './model.ts'

/** Returns the ids of a branch and all branches growing from it. */
export function subtree(model: TreeModel, branchId: number): Set<number> {
  const ids = new Set<number>()
  const stack = [branchId]
  for (let id = stack.pop(); id !== undefined; id = stack.pop()) {
    const branch = model.branches[id]
    if (!branch || ids.has(id)) continue
    ids.add(id)
    stack.push(...branch.children)
  }
  return ids
}

/** Returns every branch removed by a list of cuts. */
export function removedBranches(
  model: TreeModel,
  cuts: readonly number[],
): Set<number> {
  const removed = new Set<number>()
  for (const cut of cuts) for (const id of subtree(model, cut)) removed.add(id)
  return removed
}

/** Counts the leaves still on the tree after the cuts. */
export function remainingLeafCount(
  model: TreeModel,
  removed: ReadonlySet<number>,
): number {
  return model.leaves.filter(leaf => !removed.has(leaf.branch)).length
}
