// Draws the target shape as an ink outline standing behind the tree.

import * as THREE from 'three'
import type {Shape} from '../../shared/puzzle/shape.ts'

/** A flat ribbon along the shape's edge, `width` units wide, at depth `z`. */
export function outlineMesh(
  shape: Shape,
  z: number,
  width: number,
): THREE.Mesh {
  const verts: number[] = []
  const indices: number[] = []
  const pts = shape.points
  const n = pts.length

  for (let i = 0; i < n; i++) {
    const prev = pts[(i - 1 + n) % n]
    const here = pts[i]
    const next = pts[(i + 1) % n]
    if (!prev || !here || !next) continue
    // Offset each corner along the average of its two edge normals.
    const nx1 = -(here[1] - prev[1])
    const ny1 = here[0] - prev[0]
    const nx2 = -(next[1] - here[1])
    const ny2 = next[0] - here[0]
    let nx = nx1 / Math.hypot(nx1, ny1) + nx2 / Math.hypot(nx2, ny2)
    let ny = ny1 / Math.hypot(nx1, ny1) + ny2 / Math.hypot(nx2, ny2)
    const length = Math.hypot(nx, ny) || 1
    nx = (nx / length) * (width / 2)
    ny = (ny / length) * (width / 2)
    verts.push(here[0] - nx, here[1] - ny, z, here[0] + nx, here[1] + ny, z)
    const a = i * 2
    const b = ((i + 1) % n) * 2
    indices.push(a, a + 1, b, b, a + 1, b + 1)
  }

  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3))
  geometry.setIndex(indices)
  return new THREE.Mesh(
    geometry,
    new THREE.MeshBasicMaterial({
      color: 0x2b2620,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.8,
    }),
  )
}
