import * as THREE from 'three'
import {removedBranches} from '../shared/tree/cut.ts'
import {generateTree} from '../shared/tree/model.ts'
import {SPECIES, type Species, treeOptions} from '../shared/tree/species.ts'
import {TreeView} from './tree/view.ts'

// Temporary test scene: draws the day's tree from our own generator.
// Tap to cut a random branch; double-tap to change species or seed.
// Real cutting controls come in the next PR.

const canvas = document.getElementById('scene') as HTMLCanvasElement
const stats = document.getElementById('stats') as HTMLPreElement

const renderer = new THREE.WebGLRenderer({antialias: true, canvas})
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
renderer.shadowMap.enabled = true

const scene = new THREE.Scene()
scene.background = new THREE.Color(0xe9e4d8)

const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 500)

scene.add(new THREE.HemisphereLight(0xffffff, 0x8a7a5c, 1.2))
const sun = new THREE.DirectionalLight(0xffffff, 2)
sun.position.set(20, 40, 25)
sun.castShadow = true
sun.shadow.mapSize.set(1024, 1024)
scene.add(sun)

const ground = new THREE.Mesh(
  new THREE.CircleGeometry(30, 48),
  new THREE.MeshStandardMaterial({color: 0xcfc6b0}),
)
ground.rotation.x = -Math.PI / 2
ground.receiveShadow = true
scene.add(ground)

let speciesIndex = 0
let seed = dailySeed(new Date())
let view: TreeView | undefined
let cuts: number[] = []
let info = ''

function dailySeed(date: Date): number {
  const y = date.getUTCFullYear()
  const m = date.getUTCMonth() + 1
  const d = date.getUTCDate()
  return y * 10000 + m * 100 + d
}

function buildTree(): void {
  const species: Species = SPECIES[speciesIndex] ?? 'oak'
  const started = performance.now()
  const model = generateTree(treeOptions(species, seed))
  if (view) {
    scene.remove(view)
    view.dispose()
  }
  view = new TreeView(model)
  scene.add(view)
  cuts = []
  const ms = performance.now() - started
  info = `${species} · seed ${seed} · built in ${ms.toFixed(0)} ms`
  frameCamera()
}

function cutRandomBranch(): void {
  if (!view) return
  const candidates = view.model.branches.filter(b => b.level > 0)
  const pick = candidates[Math.floor(Math.random() * candidates.length)]
  if (!pick) return
  const started = performance.now()
  cuts.push(pick.id)
  view.show(removedBranches(view.model, cuts))
  const ms = performance.now() - started
  info = `${info.split('\n')[0]}\ncut branch ${pick.id} · rebuilt in ${ms.toFixed(0)} ms`
}

function frameCamera(): void {
  if (!view) return
  const box = new THREE.Box3().setFromObject(view)
  const size = box.getSize(new THREE.Vector3())
  const center = box.getCenter(new THREE.Vector3())
  const fit = Math.max(size.y, size.x / camera.aspect)
  const distance =
    fit / (2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)))
  camera.position.set(center.x, center.y, center.z + distance * 1.15)
  camera.lookAt(center)
}

function resize(): void {
  const width = canvas.clientWidth
  const height = canvas.clientHeight
  renderer.setSize(width, height, false)
  camera.aspect = width / height
  camera.updateProjectionMatrix()
  frameCamera()
}

let lastTap = 0
canvas.addEventListener('pointerup', () => {
  const now = performance.now()
  if (now - lastTap < 300) {
    speciesIndex = (speciesIndex + 1) % SPECIES.length
    if (speciesIndex === 0) seed += 1
    buildTree()
    lastTap = 0
    return
  }
  lastTap = now
  cutRandomBranch()
})

let frames = 0
let lastFpsTime = performance.now()
const clock = new THREE.Clock()

function animate(): void {
  view?.update(clock.getElapsedTime())
  renderer.render(scene, camera)

  frames += 1
  const now = performance.now()
  if (now - lastFpsTime >= 1000) {
    const fps = Math.round((frames * 1000) / (now - lastFpsTime))
    frames = 0
    lastFpsTime = now
    const tris = renderer.info.render.triangles
    stats.textContent = `${info}\n${fps} fps · ${tris.toLocaleString()} tris\ntap: cut · double-tap: next tree`
  }
}

window.addEventListener('resize', resize)
buildTree()
resize()
renderer.setAnimationLoop(animate)
