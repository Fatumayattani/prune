// The animation that plays when a branch is cut: the piece drops, bounces
// once or twice and shrinks away, while a handful of leaves flutter off.
// Everything finishes in under a second.

import * as THREE from 'three'

const GRAVITY = 80
const LIFETIME = 0.95
const SHRINK_TIME = 0.25
const BOUNCE = 0.35
const MAX_LEAVES = 24

type FallingPiece = {
  readonly pivot: THREE.Group
  readonly startY: number
  readonly lowest: number
  readonly spin: number
  velocity: number
  drop: number
  bounces: number
  age: number
}

type FlyingLeaf = {
  readonly position: THREE.Vector3
  readonly velocity: THREE.Vector3
  readonly rotation: THREE.Euler
  readonly spin: THREE.Vector3
  readonly size: number
}

type LeafBurst = {
  readonly mesh: THREE.InstancedMesh
  readonly leaves: FlyingLeaf[]
  age: number
}

export class CutEffects {
  readonly #scene: THREE.Scene
  readonly #onLand: (strength: number) => void
  #pieces: FallingPiece[] = []
  #bursts: LeafBurst[] = []

  constructor(scene: THREE.Scene, onLand: (strength: number) => void) {
    this.#scene = scene
    this.#onLand = onLand
  }

  /**
   * Starts the fall. `piece` is a copy of the cut branches, `cutPoint` is
   * where the branch was cut, `leafCenters` are where its leaves were.
   */
  spawn(
    piece: THREE.Group,
    cutPoint: THREE.Vector3,
    leafCenters: readonly THREE.Vector3[],
    leafMaterial: THREE.Material,
    leafSize: number,
  ): void {
    // Rotate around the cut point by wrapping the piece in a pivot group.
    const pivot = new THREE.Group()
    pivot.position.copy(cutPoint)
    piece.position.sub(cutPoint)
    pivot.add(piece)
    this.#scene.add(pivot)
    pivot.updateMatrixWorld(true)

    const box = new THREE.Box3().setFromObject(piece)
    this.#pieces.push({
      pivot,
      startY: cutPoint.y,
      lowest: Number.isFinite(box.min.y) ? box.min.y : cutPoint.y,
      spin: (Math.random() - 0.5) * 1.2,
      velocity: 0,
      drop: 0,
      bounces: 0,
      age: 0,
    })

    this.#burst(leafCenters, leafMaterial, leafSize)
  }

  update(dt: number): void {
    const step = Math.min(dt, 1 / 20)
    this.#pieces = this.#pieces.filter(piece => this.#updatePiece(piece, step))
    this.#bursts = this.#bursts.filter(burst => this.#updateBurst(burst, step))
  }

  #burst(
    centers: readonly THREE.Vector3[],
    material: THREE.Material,
    size: number,
  ): void {
    if (centers.length === 0) return
    const picked = sample(centers, MAX_LEAVES)
    const flat = material.clone()
    flat.onBeforeCompile = () => {}
    const mesh = new THREE.InstancedMesh(
      new THREE.PlaneGeometry(size, size),
      flat,
      picked.length,
    )
    mesh.frustumCulled = false
    this.#scene.add(mesh)
    this.#bursts.push({
      mesh,
      age: 0,
      leaves: picked.map(position => ({
        position: position.clone(),
        velocity: new THREE.Vector3(
          (Math.random() - 0.5) * 14,
          4 + Math.random() * 10,
          (Math.random() - 0.5) * 14,
        ),
        rotation: new THREE.Euler(
          Math.random() * Math.PI,
          Math.random() * Math.PI,
          Math.random() * Math.PI,
        ),
        spin: new THREE.Vector3(
          (Math.random() - 0.5) * 12,
          (Math.random() - 0.5) * 12,
          (Math.random() - 0.5) * 12,
        ),
        size,
      })),
    })
  }

  #updatePiece(piece: FallingPiece, dt: number): boolean {
    piece.age += dt
    piece.velocity -= GRAVITY * dt
    piece.drop += piece.velocity * dt

    // Bounce off the ground (y = 0) using the piece's lowest point.
    if (piece.lowest + piece.drop <= 0 && piece.velocity < 0) {
      piece.drop = -piece.lowest
      if (piece.bounces < 2) {
        this.#onLand(piece.bounces === 0 ? 1 : 0.4)
      }
      piece.velocity = -piece.velocity * BOUNCE
      piece.bounces += 1
    }

    piece.pivot.position.y = piece.startY + piece.drop
    piece.pivot.rotation.z = piece.spin * Math.min(1, piece.age * 3)
    piece.pivot.scale.setScalar(shrink(piece.age))

    if (piece.age < LIFETIME) return true
    this.#scene.remove(piece.pivot)
    piece.pivot.traverse(object => {
      // Materials are shared with the tree, so only geometry is disposed.
      if (object instanceof THREE.Mesh) object.geometry.dispose()
    })
    return false
  }

  #updateBurst(burst: LeafBurst, dt: number): boolean {
    burst.age += dt
    const matrix = new THREE.Matrix4()
    const quaternion = new THREE.Quaternion()
    const scale = new THREE.Vector3()
    burst.leaves.forEach((leaf, i) => {
      leaf.velocity.y -= GRAVITY * 0.35 * dt
      leaf.velocity.multiplyScalar(1 - 1.5 * dt)
      leaf.position.addScaledVector(leaf.velocity, dt)
      leaf.position.y = Math.max(leaf.position.y, 0.05)
      leaf.rotation.x += leaf.spin.x * dt
      leaf.rotation.y += leaf.spin.y * dt
      leaf.rotation.z += leaf.spin.z * dt
      quaternion.setFromEuler(leaf.rotation)
      scale.setScalar(shrink(burst.age))
      matrix.compose(leaf.position, quaternion, scale)
      burst.mesh.setMatrixAt(i, matrix)
    })
    burst.mesh.instanceMatrix.needsUpdate = true

    if (burst.age < LIFETIME) return true
    this.#scene.remove(burst.mesh)
    burst.mesh.geometry.dispose()
    const material = burst.mesh.material
    if (material instanceof THREE.Material) material.dispose()
    return false
  }
}

/** Full size until the last moment, then shrinks smoothly to nothing. */
function shrink(age: number): number {
  const t = (age - (LIFETIME - SHRINK_TIME)) / SHRINK_TIME
  return t <= 0 ? 1 : Math.max(0, 1 - t * t)
}

function sample<T>(items: readonly T[], count: number): T[] {
  if (items.length <= count) return [...items]
  const step = items.length / count
  return Array.from(
    {length: count},
    (_, i) => items[Math.floor(i * step)],
  ).filter((item): item is T => item !== undefined)
}
