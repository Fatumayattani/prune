import {Tree} from '@dgreenheck/ez-tree'
import * as THREE from 'three'

// Spike: render a seeded EZ-Tree tree and measure size and frame rate.
// Tap anywhere to cycle presets and seeds.

const PRESETS = ['Oak Small', 'Ash Small', 'Pine Small', 'Aspen Small'] as const

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

const tree = new Tree()
scene.add(tree)

let presetIndex = 0
let seed = dailySeed(new Date())

function dailySeed(date: Date): number {
  const y = date.getUTCFullYear()
  const m = date.getUTCMonth() + 1
  const d = date.getUTCDate()
  return y * 10000 + m * 100 + d
}

function buildTree(): void {
  const preset = PRESETS[presetIndex] ?? PRESETS[0]
  const started = performance.now()
  tree.loadPreset(preset)
  tree.options.seed = seed
  tree.generate()
  tree.traverse(obj => {
    obj.castShadow = true
  })
  const buildMs = performance.now() - started
  frameCamera()
  info = `${preset} · seed ${seed}\nbuilt in ${buildMs.toFixed(0)} ms`
}

function frameCamera(): void {
  const box = new THREE.Box3().setFromObject(tree)
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

canvas.addEventListener('pointerup', () => {
  presetIndex = (presetIndex + 1) % PRESETS.length
  if (presetIndex === 0) seed += 1
  buildTree()
})

let info = ''
let frames = 0
let fps = 0
let lastFpsTime = performance.now()
const clock = new THREE.Clock()

function animate(): void {
  tree.update(clock.getElapsedTime())
  renderer.render(scene, camera)

  frames += 1
  const now = performance.now()
  if (now - lastFpsTime >= 1000) {
    fps = Math.round((frames * 1000) / (now - lastFpsTime))
    frames = 0
    lastFpsTime = now
    const tris = renderer.info.render.triangles
    stats.textContent = `${info}\n${fps} fps · ${tris.toLocaleString()} tris\ntap to change tree`
  }
}

window.addEventListener('resize', resize)
buildTree()
resize()
renderer.setAnimationLoop(animate)
