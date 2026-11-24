// Loads bark and leaf textures as separate files from public/textures,
// only for the species being shown. Textures come from EZ-Tree (MIT).

import * as THREE from 'three'
import type {BarkType, LeafType} from '../../shared/tree/options.ts'

const loader = new THREE.TextureLoader()
const cache = new Map<string, THREE.Texture>()

function load(path: string, srgb: boolean): THREE.Texture {
  const cached = cache.get(path)
  if (cached) return cached
  const texture = loader.load(path)
  texture.premultiplyAlpha = true
  if (srgb) texture.colorSpace = THREE.SRGBColorSpace
  cache.set(path, texture)
  return texture
}

export type BarkTextures = {
  readonly ao: THREE.Texture
  readonly color: THREE.Texture
  readonly normal: THREE.Texture
}

export function barkTextures(
  type: BarkType,
  scale: {readonly x: number; readonly y: number},
): BarkTextures {
  const textures = {
    ao: load(`textures/bark/${type}_ao_1k.jpg`, false),
    color: load(`textures/bark/${type}_color_1k.jpg`, true),
    normal: load(`textures/bark/${type}_normal_1k.jpg`, false),
  }
  for (const texture of Object.values(textures)) {
    texture.wrapS = THREE.RepeatWrapping
    texture.wrapT = THREE.RepeatWrapping
    texture.repeat.set(scale.x, 1 / scale.y)
  }
  return textures
}

export function leafTexture(type: LeafType): THREE.Texture {
  return load(`textures/leaves/${type}_color.png`, true)
}
