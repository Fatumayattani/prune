// Tree structure generator ported from EZ-Tree's Tree.generate()
// (MIT, Daniel Greenheck). Unlike EZ-Tree, it keeps every branch as its own
// node with parent and child links, so branches can be cut. It produces the
// same branch and leaf placement as EZ-Tree for the same options and seed.
//
// This module has no rendering code so the server can replay cuts too.

import * as THREE from 'three'
import {atLevel, Billboard, type TreeOptions, TreeType} from './options.ts'
import {Rng} from './rng.ts'

export type Section = {
  readonly origin: THREE.Vector3
  readonly orientation: THREE.Euler
  readonly radius: number
}

export type BranchNode = {
  readonly id: number
  readonly parent: number | undefined
  readonly children: number[]
  readonly level: number
  readonly segmentCount: number
  readonly sections: readonly Section[]
}

export type LeafNode = {
  readonly branch: number
  readonly origin: THREE.Vector3
  readonly orientation: THREE.Euler
  readonly size: number
}

export type TreeModel = {
  readonly options: TreeOptions
  readonly branches: readonly BranchNode[]
  readonly leaves: readonly LeafNode[]
}

type QueuedBranch = {
  readonly parent: number | undefined
  readonly origin: THREE.Vector3
  readonly orientation: THREE.Euler
  readonly length: number
  readonly radius: number
  readonly level: number
  readonly sectionCount: number
  readonly segmentCount: number
}

const UP = new THREE.Vector3(0, 1, 0)
const X_AXIS = new THREE.Vector3(1, 0, 0)

export function generateTree(options: TreeOptions): TreeModel {
  const rng = new Rng(options.seed)
  const branches: BranchNode[] = []
  const leaves: LeafNode[] = []
  const {branch: b} = options

  const queue: QueuedBranch[] = [
    {
      parent: undefined,
      origin: new THREE.Vector3(),
      orientation: new THREE.Euler(),
      length: atLevel(b.length, 0),
      radius: atLevel(b.radius, 0),
      level: 0,
      sectionCount: atLevel(b.sections, 0),
      segmentCount: atLevel(b.segments, 0),
    },
  ]

  for (let next = queue.shift(); next; next = queue.shift()) {
    generateBranch(next)
  }

  return {options, branches, leaves}

  function generateBranch(branch: QueuedBranch): void {
    const id = branches.length
    if (branch.parent !== undefined) branches[branch.parent]?.children.push(id)

    const sectionOrientation = branch.orientation.clone()
    const sectionOrigin = branch.origin.clone()
    // EZ-Tree compares against 'Deciduous' (capital D) here, which never
    // matches, so the division never happens. Kept as-is for identical trees.
    const sectionLength = branch.length / branch.sectionCount
    const sections: Section[] = []

    for (let i = 0; i <= branch.sectionCount; i++) {
      let sectionRadius = branch.radius
      if (i === branch.sectionCount && branch.level === b.levels) {
        sectionRadius = 0.001
      } else if (options.type === TreeType.Deciduous) {
        sectionRadius *=
          1 - atLevel(b.taper, branch.level) * (i / branch.sectionCount)
      } else if (options.type === TreeType.Evergreen) {
        sectionRadius *= 1 - i / branch.sectionCount
      }

      sections.push({
        origin: sectionOrigin.clone(),
        orientation: sectionOrientation.clone(),
        radius: sectionRadius,
      })

      sectionOrigin.add(
        new THREE.Vector3(0, sectionLength, 0).applyEuler(sectionOrientation),
      )

      const gnarliness =
        Math.max(1, 1 / Math.sqrt(sectionRadius)) *
        atLevel(b.gnarliness, branch.level)
      sectionOrientation.x += rng.random(gnarliness, -gnarliness)
      sectionOrientation.z += rng.random(gnarliness, -gnarliness)

      const qSection = new THREE.Quaternion().setFromEuler(sectionOrientation)
      const qTwist = new THREE.Quaternion().setFromAxisAngle(
        UP,
        atLevel(b.twist, branch.level),
      )
      const qForce = new THREE.Quaternion().setFromUnitVectors(
        UP,
        new THREE.Vector3().copy(b.force.direction),
      )
      qSection.multiply(qTwist)
      qSection.rotateTowards(qForce, b.force.strength / sectionRadius)
      sectionOrientation.setFromQuaternion(qSection)
    }

    branches.push({
      id,
      parent: branch.parent,
      children: [],
      level: branch.level,
      segmentCount: branch.segmentCount,
      sections,
    })

    const last = sections[sections.length - 1]
    if (options.type === TreeType.Deciduous && last) {
      if (branch.level < b.levels) {
        // The terminal branch continues growing from the end of this one.
        queue.push({
          parent: id,
          origin: last.origin,
          orientation: last.orientation,
          length: atLevel(b.length, branch.level + 1),
          radius: last.radius,
          level: branch.level + 1,
          sectionCount: branch.sectionCount,
          segmentCount: branch.segmentCount,
        })
      } else {
        addLeaf(id, last.origin, last.orientation)
      }
    }

    if (branch.level === b.levels) {
      generateLeaves(id, sections)
    } else if (branch.level < b.levels) {
      generateChildBranches(id, branch.level + 1, sections)
    }
  }

  function generateChildBranches(
    parent: number,
    level: number,
    sections: readonly Section[],
  ): void {
    const count = atLevel(b.children, level - 1)
    const radialOffset = rng.random()

    for (let i = 0; i < count; i++) {
      const start = rng.random(1, atLevel(b.start, level))
      const {origin, orientation, radiusAt} = pointAlong(sections, start)

      const radialAngle = 2 * Math.PI * (radialOffset + i / count)
      const q1 = new THREE.Quaternion().setFromAxisAngle(
        X_AXIS,
        atLevel(b.angle, level) / (180 / Math.PI),
      )
      const q2 = new THREE.Quaternion().setFromAxisAngle(UP, radialAngle)
      const q3 = new THREE.Quaternion().setFromEuler(orientation)
      const childOrientation = new THREE.Euler().setFromQuaternion(
        q3.multiply(q2.multiply(q1)),
      )

      const length =
        atLevel(b.length, level) *
        (options.type === TreeType.Evergreen ? 1 - start : 1)

      queue.push({
        parent,
        origin,
        orientation: childOrientation,
        length,
        radius: atLevel(b.radius, level) * radiusAt,
        level,
        sectionCount: atLevel(b.sections, level),
        segmentCount: atLevel(b.segments, level),
      })
    }
  }

  function generateLeaves(branch: number, sections: readonly Section[]): void {
    const {leaves: l} = options
    const radialOffset = rng.random()

    for (let i = 0; i < l.count; i++) {
      const start = rng.random(1, l.start)
      const {origin, orientation} = pointAlong(sections, start)

      const radialAngle = 2 * Math.PI * (radialOffset + i / l.count)
      const q1 = new THREE.Quaternion().setFromAxisAngle(
        X_AXIS,
        l.angle / (180 / Math.PI),
      )
      const q2 = new THREE.Quaternion().setFromAxisAngle(UP, radialAngle)
      const q3 = new THREE.Quaternion().setFromEuler(orientation)
      const leafOrientation = new THREE.Euler().setFromQuaternion(
        q3.multiply(q2.multiply(q1)),
      )

      addLeaf(branch, origin, leafOrientation)
    }
  }

  function addLeaf(
    branch: number,
    origin: THREE.Vector3,
    orientation: THREE.Euler,
  ): void {
    const {leaves: l} = options
    const size = l.size * (1 + rng.random(l.sizeVariance, -l.sizeVariance))
    leaves.push({
      branch,
      origin: origin.clone(),
      orientation: orientation.clone(),
      size,
    })
  }
}

/** Interpolates position, orientation and radius at t (0 to 1) along a branch. */
function pointAlong(
  sections: readonly Section[],
  t: number,
): {origin: THREE.Vector3; orientation: THREE.Euler; radiusAt: number} {
  const index = Math.floor(t * (sections.length - 1))
  const a = sections[index]
  const bSection = index === sections.length - 1 ? a : sections[index + 1]
  if (!a || !bSection) throw Error('branch has no sections')

  const alpha =
    (t - index / (sections.length - 1)) / (1 / (sections.length - 1))
  const origin = new THREE.Vector3().lerpVectors(
    a.origin,
    bSection.origin,
    alpha,
  )
  const radiusAt = (1 - alpha) * a.radius + alpha * bSection.radius
  const qA = new THREE.Quaternion().setFromEuler(a.orientation)
  const qB = new THREE.Quaternion().setFromEuler(bSection.orientation)
  const orientation = new THREE.Euler().setFromQuaternion(qB.slerp(qA, alpha))
  return {origin, orientation, radiusAt}
}

/** Whether leaves render as one quad or two crossed quads. */
export function leafQuads(options: TreeOptions): number {
  return options.leaves.billboard === Billboard.Double ? 2 : 1
}
