// Where to draw the cut face (with growth rings) when a branch is cut.
// A side branch starts on its parent's centre line, so the face is moved
// out along the branch to where it leaves the parent's bark.

import * as THREE from 'three'
import type {TreeModel} from '../../shared/tree/model.ts'

export type StumpPose = {
  readonly position: THREE.Vector3
  /** Unit vector the cut face points along (the branch's growth direction). */
  readonly normal: THREE.Vector3
  readonly radius: number
}

const UP = new THREE.Vector3(0, 1, 0)
/** Branches closer than this to their parent's direction continue it. */
const CONTINUATION_ANGLE = THREE.MathUtils.degToRad(15)

export function stumpPose(
  model: TreeModel,
  branchId: number,
): StumpPose | undefined {
  const branch = model.branches[branchId]
  const base = branch?.sections[0]
  if (!branch || !base || branch.parent === undefined) return undefined
  const parent = model.branches[branch.parent]
  if (!parent) return undefined

  const normal = UP.clone().applyEuler(base.orientation).normalize()

  // The parent section closest to where this branch starts.
  let nearest = parent.sections[0]
  let nearestDistance = Number.POSITIVE_INFINITY
  for (const section of parent.sections) {
    const distance = section.origin.distanceTo(base.origin)
    if (distance < nearestDistance) {
      nearest = section
      nearestDistance = distance
    }
  }
  if (!nearest) return undefined

  const parentAxis = UP.clone().applyEuler(nearest.orientation).normalize()
  const angle = normal.angleTo(parentAxis)
  // Distance along the branch from the parent's centre line to its surface.
  const offset =
    angle < CONTINUATION_ANGLE
      ? 0
      : Math.min(nearest.radius / Math.sin(angle), nearest.radius * 2.5)

  return {
    position: base.origin.clone().addScaledVector(normal, offset),
    normal,
    radius: base.radius,
  }
}
