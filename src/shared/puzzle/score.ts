// Scores a pruned tree against the target shape. Shared so the server can
// check a submitted solution and get exactly the same result.

import * as THREE from 'three'
import {removedBranches} from '../tree/cut.ts'
import type {LeafNode, TreeModel} from '../tree/model.ts'
import {contains, type Shape} from './shape.ts'

/** Points lost for every cut over the target number of cuts. */
export const OVER_TARGET_PENALTY = 5

export type Score = {
  /** Leaves still on the tree. */
  readonly kept: number
  /** Leaves on the tree before any cuts. */
  readonly total: number
  /** Leaves still on the tree whose centre is outside the shape. */
  readonly outside: number
  /** True when every remaining leaf is inside the shape. */
  readonly fits: boolean
  readonly cuts: number
  readonly targetCuts: number | undefined
  /** 0 to 100. Zero until the tree fits. */
  readonly points: number
}

/** The centre of a leaf, where it's checked against the shape. */
export function leafCenter(leaf: LeafNode): THREE.Vector3 {
  return new THREE.Vector3(0, leaf.size / 2, 0)
    .applyEuler(leaf.orientation)
    .add(leaf.origin)
}

/** Indices of the remaining leaves that sit outside the shape. */
export function leavesOutside(
  model: TreeModel,
  removed: ReadonlySet<number>,
  shape: Shape,
): Set<number> {
  const outside = new Set<number>()
  model.leaves.forEach((leaf, index) => {
    if (removed.has(leaf.branch)) return
    const c = leafCenter(leaf)
    if (!contains(shape, [c.x, c.y])) outside.add(index)
  })
  return outside
}

export function score(
  model: TreeModel,
  cuts: readonly number[],
  shape: Shape,
  targetCuts?: number,
): Score {
  const removed = removedBranches(model, cuts)
  const total = model.leaves.length
  const kept = model.leaves.filter(leaf => !removed.has(leaf.branch)).length
  const outside = leavesOutside(model, removed, shape).size
  const fits = outside === 0

  let points = 0
  if (fits && total > 0) {
    const overTarget =
      targetCuts === undefined ? 0 : Math.max(0, cuts.length - targetCuts)
    points = Math.max(
      0,
      Math.round((kept / total) * 100) - overTarget * OVER_TARGET_PENALTY,
    )
  }

  return {
    kept,
    total,
    outside,
    fits,
    cuts: cuts.length,
    targetCuts,
    points,
  }
}
