import * as THREE from 'three'
import {remainingLeafCount, subtree} from '../shared/tree/cut.ts'
import {CutHistory} from '../shared/tree/history.ts'
import {generateTree} from '../shared/tree/model.ts'
import {SPECIES, type Species, treeOptions} from '../shared/tree/species.ts'
import {buzz, playSnip, playThud} from './sound.ts'
import {CutEffects} from './tree/effects.ts'
import {pickBranch} from './tree/pick.ts'
import {stumpPose} from './tree/stump.ts'
import {TreeView} from './tree/view.ts'

// Tap a branch to select it (it turns red with everything growing from it),
// tap it again to cut. Tap empty space to deselect. Undo takes back a cut.

/** How far from a branch a tap still counts, in CSS pixels. */
const TAP_REACH = 28
/** A press that moves further than this is a drag, not a tap. */
const TAP_SLOP = 10

const canvas = document.getElementById('scene') as HTMLCanvasElement
const stats = document.getElementById('stats') as HTMLPreElement
const hint = document.getElementById('hint') as HTMLParagraphElement
const undoButton = document.getElementById('undo') as HTMLButtonElement
const cutsLabel = document.getElementById('cuts') as HTMLSpanElement
const nextTreeButton = document.getElementById('next-tree') as HTMLButtonElement

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

const effects = new CutEffects(scene, playThud)

let speciesIndex = 0
let seed = dailySeed(new Date())
let view: TreeView | undefined
let history: CutHistory | undefined
let selected: number | undefined
let info = ''

function dailySeed(date: Date): number {
  const y = date.getUTCFullYear()
  const m = date.getUTCMonth() + 1
  const d = date.getUTCDate()
  return y * 10000 + m * 100 + d
}

function buildTree(): void {
  const species: Species = SPECIES[speciesIndex] ?? 'oak'
  const model = generateTree(treeOptions(species, seed))
  if (view) {
    scene.remove(view)
    view.dispose()
  }
  view = new TreeView(model)
  history = new CutHistory(model)
  selected = undefined
  scene.add(view)
  info = `${species} · seed ${seed}`
  frameCamera()
  refresh()
}

/** Redraws the tree and updates the text and buttons to match the state. */
function refresh(): void {
  if (!view || !history) return
  const started = performance.now()
  const selection =
    selected === undefined ? new Set<number>() : subtree(view.model, selected)
  view.show(history.removed, selection, history.cuts)
  const ms = performance.now() - started

  const count = history.cuts.length
  cutsLabel.textContent = `${count} ${count === 1 ? 'cut' : 'cuts'}`
  undoButton.disabled = count === 0

  if (selected === undefined) {
    hint.textContent = 'Tap a branch to select it'
  } else {
    const before = remainingLeafCount(view.model, history.removed)
    const after = remainingLeafCount(
      view.model,
      new Set([...history.removed, ...selection]),
    )
    hint.textContent = `Tap again to cut · removes ${before - after} leaves`
  }
  info = `${info.split('\n')[0]}\nrebuilt in ${ms.toFixed(0)} ms`
}

function onTap(x: number, y: number): void {
  if (!view || !history) return
  const rect = canvas.getBoundingClientRect()
  const targets = view
    .targets(camera, rect.width, rect.height, history.removed)
    .filter(target => history?.canCut(target.branch))
  const picked = pickBranch(targets, [x - rect.left, y - rect.top], TAP_REACH)

  if (picked !== undefined && picked === selected) {
    cut(picked)
  } else {
    selected = picked
  }
  refresh()
}

function cut(branchId: number): void {
  if (!view || !history) return
  const falling = new Set(
    [...subtree(view.model, branchId)].filter(id => !history?.removed.has(id)),
  )
  const cutPoint =
    stumpPose(view.model, branchId)?.position ??
    view.model.branches[branchId]?.sections[0]?.origin
  if (!history.cut(branchId) || !cutPoint) return
  selected = undefined

  effects.spawn(
    view.detach(falling),
    cutPoint.clone(),
    view.leafCenters(falling),
    view.leafMaterial,
    view.model.options.leaves.size,
  )
  playSnip()
  buzz()
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

let pressStart: {x: number; y: number} | undefined
canvas.addEventListener('pointerdown', event => {
  pressStart = {x: event.clientX, y: event.clientY}
})
canvas.addEventListener('pointerup', event => {
  if (!pressStart) return
  const moved = Math.hypot(
    event.clientX - pressStart.x,
    event.clientY - pressStart.y,
  )
  pressStart = undefined
  if (moved <= TAP_SLOP) onTap(event.clientX, event.clientY)
})
canvas.addEventListener('pointercancel', () => {
  pressStart = undefined
})

undoButton.addEventListener('click', () => {
  history?.undo()
  selected = undefined
  refresh()
})

nextTreeButton.addEventListener('click', () => {
  speciesIndex = (speciesIndex + 1) % SPECIES.length
  if (speciesIndex === 0) seed += 1
  buildTree()
})

let frames = 0
let lastFpsTime = performance.now()
let lastFrame = 0
function animate(time: number): void {
  const dt = lastFrame === 0 ? 0 : (time - lastFrame) / 1000
  lastFrame = time
  view?.update(time / 1000)
  effects.update(dt)
  renderer.render(scene, camera)

  frames += 1
  const now = performance.now()
  if (now - lastFpsTime >= 1000) {
    const fps = Math.round((frames * 1000) / (now - lastFpsTime))
    frames = 0
    lastFpsTime = now
    const tris = renderer.info.render.triangles
    stats.textContent = `${info}\n${fps} fps · ${tris.toLocaleString()} tris`
  }
}

window.addEventListener('resize', resize)
buildTree()
resize()
renderer.setAnimationLoop(animate)
