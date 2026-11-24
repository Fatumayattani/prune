// A procedural cut-wood texture: pale heartwood with growth rings and a
// darker bark edge. Drawn once on a canvas, so there's no image to load.

import * as THREE from 'three'

let texture: THREE.Texture | undefined

export function ringsTexture(): THREE.Texture {
  if (texture) return texture
  const size = 256
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const g = canvas.getContext('2d')
  if (!g) throw Error('2D canvas unavailable')

  const c = size / 2
  const wood = g.createRadialGradient(c, c, 0, c, c, c)
  wood.addColorStop(0, '#e9cf9f')
  wood.addColorStop(0.8, '#d2ad74')
  wood.addColorStop(0.88, '#a77b4a')
  wood.addColorStop(0.9, '#4a3423')
  wood.addColorStop(1, '#3a281b')
  g.fillStyle = wood
  g.fillRect(0, 0, size, size)

  // Slightly wobbly rings, closer together towards the bark.
  g.strokeStyle = 'rgb(120 82 46 / 0.55)'
  for (let ring = 1; ring <= 9; ring++) {
    const r = c * 0.86 * Math.sqrt(ring / 9)
    g.lineWidth = 1 + (ring % 3 === 0 ? 1 : 0)
    g.beginPath()
    for (let a = 0; a <= 64; a++) {
      const angle = (a / 64) * Math.PI * 2
      const wobble = 1 + 0.025 * Math.sin(angle * 3 + ring)
      const x = c + Math.cos(angle) * r * wobble
      const y = c + Math.sin(angle) * r * wobble
      if (a === 0) g.moveTo(x, y)
      else g.lineTo(x, y)
    }
    g.stroke()
  }

  texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  return texture
}
