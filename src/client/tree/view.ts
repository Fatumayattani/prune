// Renders a TreeModel as two meshes (branches and leaves), skipping any
// branches that have been cut. Geometry code ported from EZ-Tree
// (MIT, Daniel Greenheck).

import * as THREE from 'three'
import {leafQuads, type TreeModel} from '../../shared/tree/model.ts'
import {barkTextures, leafTexture} from './textures.ts'
import {addWind} from './wind.ts'

export class TreeView extends THREE.Group {
  readonly model: TreeModel
  readonly #branches: THREE.Mesh<THREE.BufferGeometry, THREE.MeshPhongMaterial>
  readonly #leaves: THREE.Mesh<THREE.BufferGeometry, THREE.MeshPhongMaterial>
  readonly #time: {value: number}

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
    this.#time = addWind(leafMaterial)

    this.#branches = new THREE.Mesh(new THREE.BufferGeometry(), barkMaterial)
    this.#leaves = new THREE.Mesh(new THREE.BufferGeometry(), leafMaterial)
    for (const mesh of [this.#branches, this.#leaves]) {
      mesh.castShadow = true
      mesh.receiveShadow = true
      this.add(mesh)
    }
    this.show(new Set())
  }

  /** Rebuilds the geometry without the removed branches. */
  show(removed: ReadonlySet<number>): void {
    this.#branches.geometry.dispose()
    this.#branches.geometry = branchGeometry(this.model, removed)
    this.#leaves.geometry.dispose()
    this.#leaves.geometry = leafGeometry(this.model, removed)
  }

  update(elapsedSeconds: number): void {
    this.#time.value = elapsedSeconds
  }

  dispose(): void {
    for (const mesh of [this.#branches, this.#leaves]) {
      mesh.geometry.dispose()
      mesh.material.dispose()
    }
  }
}

function branchGeometry(
  model: TreeModel,
  removed: ReadonlySet<number>,
): THREE.BufferGeometry {
  const verts: number[] = []
  const normals: number[] = []
  const uvs: number[] = []
  const indices: number[] = []

  for (const branch of model.branches) {
    if (removed.has(branch.id)) continue
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
  removed: ReadonlySet<number>,
): THREE.BufferGeometry {
  const verts: number[] = []
  const uvs: number[] = []
  const indices: number[] = []
  const quads = leafQuads(model.options)

  for (const leaf of model.leaves) {
    if (removed.has(leaf.branch)) continue
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
