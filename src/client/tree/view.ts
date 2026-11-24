// Renders a TreeModel. Cut branches are hidden, and a selected branch (with
// everything growing from it) is drawn highlighted so the player can see
// what a cut would remove. Geometry code ported from EZ-Tree
// (MIT, Daniel Greenheck).

import * as THREE from 'three'
import {leafQuads, type TreeModel} from '../../shared/tree/model.ts'
import type {Point, Target} from './pick.ts'
import {barkTextures, leafTexture} from './textures.ts'
import {addWind} from './wind.ts'

const HIGHLIGHT = 0xff5a3c

type Mesh = THREE.Mesh<THREE.BufferGeometry, THREE.MeshPhongMaterial>

export class TreeView extends THREE.Group {
  readonly model: TreeModel
  readonly #branches: Mesh
  readonly #leaves: Mesh
  readonly #selectedBranches: Mesh
  readonly #selectedLeaves: Mesh
  readonly #time = {value: 0}

  constructor(model: TreeModel) {
    super()
    this.model = model
    const {bark, leaves} = model.options

    const barkMaterial = new THREE.MeshPhongMaterial({
      name: 'branches',
      flatShading: bark.flatShading,
      color: new THREE.Color(bark.tint),
    })
    if (bark.textured) {
      const textures = barkTextures(bark.type, bark.textureScale)
      barkMaterial.aoMap = textures.ao
      barkMaterial.map = textures.color
      barkMaterial.normalMap = textures.normal
    }

    const leafMaterial = new THREE.MeshPhongMaterial({
      name: 'leaves',
      map: leafTexture(leaves.type),
      color: new THREE.Color(leaves.tint),
      side: THREE.DoubleSide,
      alphaTest: leaves.alphaTest,
      dithering: true,
    })
    addWind(leafMaterial, this.#time)

    const selectedBark = barkMaterial.clone()
    selectedBark.color.set(HIGHLIGHT)
    selectedBark.emissive.set(HIGHLIGHT).multiplyScalar(0.35)
    const selectedLeaf = leafMaterial.clone()
    selectedLeaf.color.set(HIGHLIGHT)
    selectedLeaf.emissive.set(HIGHLIGHT).multiplyScalar(0.35)
    addWind(selectedLeaf, this.#time)

    this.#branches = mesh(barkMaterial)
    this.#leaves = mesh(leafMaterial)
    this.#selectedBranches = mesh(selectedBark)
    this.#selectedLeaves = mesh(selectedLeaf)
    this.add(
      this.#branches,
      this.#leaves,
      this.#selectedBranches,
      this.#selectedLeaves,
    )
    this.show(new Set(), new Set())
  }

  /** Rebuilds the geometry: removed branches hidden, selected highlighted. */
  show(removed: ReadonlySet<number>, selected: ReadonlySet<number>): void {
    const normal = (id: number) => !removed.has(id) && !selected.has(id)
    const highlighted = (id: number) => !removed.has(id) && selected.has(id)
    replace(this.#branches, branchGeometry(this.model, normal))
    replace(this.#leaves, leafGeometry(this.model, normal))
    replace(this.#selectedBranches, branchGeometry(this.model, highlighted))
    replace(this.#selectedLeaves, leafGeometry(this.model, highlighted))
  }

  /**
   * Screen-space tap targets for every branch still on the tree: a line
   * along each branch plus a point at each leaf, in CSS pixels.
   */
  targets(
    camera: THREE.Camera,
    width: number,
    height: number,
    removed: ReadonlySet<number>,
  ): Target[] {
    this.updateMatrixWorld()
    const toScreen = (v: THREE.Vector3): Point => {
      const p = v.clone().applyMatrix4(this.matrixWorld).project(camera)
      return [((p.x + 1) / 2) * width, ((1 - p.y) / 2) * height]
    }

    const targets: Target[] = []
    for (const branch of this.model.branches) {
      if (removed.has(branch.id)) continue
      targets.push({
        branch: branch.id,
        points: branch.sections.map(section => toScreen(section.origin)),
      })
    }
    for (const leaf of this.model.leaves) {
      if (removed.has(leaf.branch)) continue
      const center = new THREE.Vector3(0, leaf.size / 2, 0)
        .applyEuler(leaf.orientation)
        .add(leaf.origin)
      targets.push({branch: leaf.branch, points: [toScreen(center)]})
    }
    return targets
  }

  update(elapsedSeconds: number): void {
    this.#time.value = elapsedSeconds
  }

  dispose(): void {
    for (const m of [
      this.#branches,
      this.#leaves,
      this.#selectedBranches,
      this.#selectedLeaves,
    ]) {
      m.geometry.dispose()
      m.material.dispose()
    }
  }
}

function mesh(material: THREE.MeshPhongMaterial): Mesh {
  const m = new THREE.Mesh(new THREE.BufferGeometry(), material)
  m.castShadow = true
  m.receiveShadow = true
  return m
}

function replace(m: Mesh, geometry: THREE.BufferGeometry): void {
  m.geometry.dispose()
  m.geometry = geometry
}

function branchGeometry(
  model: TreeModel,
  include: (branchId: number) => boolean,
): THREE.BufferGeometry {
  const verts: number[] = []
  const normals: number[] = []
  const uvs: number[] = []
  const indices: number[] = []

  for (const branch of model.branches) {
    if (!include(branch.id)) continue
    const offset = verts.length / 3
    const n = branch.segmentCount

    branch.sections.forEach((section, i) => {
      const v = i % 2 === 0 ? 0 : 1
      for (let j = 0; j <= n; j++) {
        const angle = (2 * Math.PI * (j % n)) / n
        const radial = new THREE.Vector3(Math.cos(angle), 0, Math.sin(angle))
        const normal = radial
          .clone()
          .applyEuler(section.orientation)
          .normalize()
        const vertex = radial
          .multiplyScalar(section.radius)
          .applyEuler(section.orientation)
          .add(section.origin)
        verts.push(vertex.x, vertex.y, vertex.z)
        normals.push(normal.x, normal.y, normal.z)
        uvs.push(j === n ? 1 : j / n, v)
      }
    })

    const stride = n + 1
    for (let i = 0; i < branch.sections.length - 1; i++) {
      for (let j = 0; j < n; j++) {
        const v1 = offset + i * stride + j
        const v2 = v1 + 1
        const v3 = v1 + stride
        const v4 = v2 + stride
        indices.push(v1, v3, v2, v2, v3, v4)
      }
    }
  }

  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3))
  geometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3))
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2))
  geometry.setIndex(indices)
  geometry.computeBoundingSphere()
  return geometry
}

function leafGeometry(
  model: TreeModel,
  include: (branchId: number) => boolean,
): THREE.BufferGeometry {
  const verts: number[] = []
  const uvs: number[] = []
  const indices: number[] = []
  const quads = leafQuads(model.options)

  for (const leaf of model.leaves) {
    if (!include(leaf.branch)) continue
    const w = leaf.size
    const l = leaf.size
    for (let q = 0; q < quads; q++) {
      const turn = new THREE.Euler(0, (q * Math.PI) / 2, 0)
      const i = verts.length / 3
      for (const corner of [
        new THREE.Vector3(-w / 2, l, 0),
        new THREE.Vector3(-w / 2, 0, 0),
        new THREE.Vector3(w / 2, 0, 0),
        new THREE.Vector3(w / 2, l, 0),
      ]) {
        corner.applyEuler(turn).applyEuler(leaf.orientation).add(leaf.origin)
        verts.push(corner.x, corner.y, corner.z)
      }
      uvs.push(0, 1, 0, 0, 1, 0, 1, 1)
      indices.push(i, i + 1, i + 2, i, i + 2, i + 3)
    }
  }

  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3))
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2))
  geometry.setIndex(indices)
  geometry.computeVertexNormals()
  geometry.computeBoundingSphere()
  return geometry
}
