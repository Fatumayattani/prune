// Tree presets copied from EZ-Tree's "Small" presets (MIT, Daniel Greenheck).
// These are starting points; bonsai tuning comes later.

import type {TreeOptions} from './options.ts'

export type Species = 'ash' | 'oak' | 'pine' | 'aspen'

export const SPECIES: readonly Species[] = ['oak', 'ash', 'pine', 'aspen']

type Preset = Omit<TreeOptions, 'seed'>

const PRESETS: Readonly<Record<Species, Preset>> = {
  ash: {
    type: 'deciduous',
    bark: {
      type: 'oak',
      tint: 13552830,
      flatShading: false,
      textured: true,
      textureScale: {x: 0.5, y: 5},
    },
    branch: {
      levels: 2,
      angle: {'1': 48, '2': 75, '3': 60},
      children: {'0': 10, '1': 3, '2': 3},
      force: {direction: {x: 0, y: 1, z: 0}, strength: -0.02},
      gnarliness: {'0': 0.11, '1': 0.09, '2': 0.05, '3': 0.09},
      length: {'0': 23.87, '1': 18, '2': 5.59, '3': 4.6},
      radius: {'0': 0.81, '1': 0.56, '2': 0.76, '3': 0.7},
      sections: {'0': 12, '1': 10, '2': 10, '3': 10},
      segments: {'0': 8, '1': 6, '2': 4, '3': 3},
      start: {'1': 0.53, '2': 0.33, '3': 0},
      taper: {'0': 0.7, '1': 0.7, '2': 0.7, '3': 0.7},
      twist: {'0': 0.3, '1': -0.07, '2': 0, '3': 0},
    },
    leaves: {
      type: 'ash',
      billboard: 'double',
      angle: 55,
      count: 30,
      start: 0,
      size: 2.05,
      sizeVariance: 0.717,
      tint: 16777215,
      alphaTest: 0.5,
    },
  },
  oak: {
    type: 'deciduous',
    bark: {
      type: 'oak',
      tint: 16774097,
      flatShading: false,
      textured: true,
      textureScale: {x: 1, y: 10},
    },
    branch: {
      levels: 3,
      angle: {'1': 54, '2': 58, '3': 32},
      children: {'0': 4, '1': 2, '2': 3},
      force: {direction: {x: 0, y: 1, z: 0}, strength: -0.01},
      gnarliness: {'0': 0.07, '1': -0.08, '2': 0.11, '3': 0.09},
      length: {'0': 28.08, '1': 4.55, '2': 9.78, '3': 7.16},
      radius: {'0': 1, '1': 1.02, '2': 0.69, '3': 1.19},
      sections: {'0': 16, '1': 9, '2': 8, '3': 1},
      segments: {'0': 7, '1': 5, '2': 3, '3': 3},
      start: {'1': 0.49, '2': 0.06, '3': 0.12},
      taper: {'0': 0.73, '1': 0.42, '2': 0.69, '3': 0.75},
      twist: {'0': -0.23, '1': 0.42, '2': 0, '3': 0},
    },
    leaves: {
      type: 'oak',
      billboard: 'double',
      angle: 42,
      count: 14,
      start: 0.16,
      size: 1.38,
      sizeVariance: 0.7,
      tint: 14013901,
      alphaTest: 0.5,
    },
  },
  pine: {
    type: 'evergreen',
    bark: {
      type: 'pine',
      tint: 16777215,
      flatShading: false,
      textured: true,
      textureScale: {x: 1, y: 1},
    },
    branch: {
      levels: 1,
      angle: {'1': 117, '2': 60, '3': 60},
      children: {'0': 91, '1': 7, '2': 5},
      force: {direction: {x: 0, y: 1, z: 0}, strength: 0},
      gnarliness: {'0': 0.05, '1': 0.08, '2': 0, '3': 0},
      length: {'0': 39.55, '1': 12.12, '2': 10, '3': 1},
      radius: {'0': 0.55, '1': 0.41, '2': 0.7, '3': 0.7},
      sections: {'0': 12, '1': 10, '2': 8, '3': 6},
      segments: {'0': 8, '1': 6, '2': 4, '3': 3},
      start: {'1': 0.16, '2': 0.3, '3': 0.3},
      taper: {'0': 0.7, '1': 0.7, '2': 0.7, '3': 0.7},
      twist: {'0': 0, '1': 0, '2': 0, '3': 0},
    },
    leaves: {
      type: 'pine',
      billboard: 'double',
      angle: 10,
      count: 21,
      start: 0,
      size: 0.965,
      sizeVariance: 0.7,
      tint: 16777215,
      alphaTest: 0.3,
    },
  },
  aspen: {
    type: 'deciduous',
    bark: {
      type: 'birch',
      tint: 16777215,
      flatShading: false,
      textured: true,
      textureScale: {x: 1, y: 1},
    },
    branch: {
      levels: 2,
      angle: {'1': 70, '2': 35, '3': 7},
      children: {'0': 4, '1': 3, '2': 3},
      force: {direction: {x: 0, y: 1, z: 0}, strength: 0.010869565217391311},
      gnarliness: {'0': 0.04, '1': -0.010000000000000007, '2': 0.12, '3': 0.02},
      length: {'0': 23.99, '1': 3.36, '2': 7.699999999999999, '3': 1},
      radius: {'0': 0.36999999999999994, '1': 0.41, '2': 0.7, '3': 0.7},
      sections: {'0': 12, '1': 10, '2': 8, '3': 6},
      segments: {'0': 8, '1': 6, '2': 4, '3': 3},
      start: {'1': 0.44999999999999996, '2': 0.32999999999999996, '3': 0},
      taper: {'0': 0.37, '1': 0.13, '2': 0.7, '3': 0.7},
      twist: {'0': 0, '1': 0, '2': 0, '3': 0},
    },
    leaves: {
      type: 'aspen',
      billboard: 'double',
      angle: 30,
      count: 13,
      start: 0.2,
      size: 2.5,
      sizeVariance: 0.7,
      tint: 16775778,
      alphaTest: 0.5,
    },
  },
}

export function treeOptions(species: Species, seed: number): TreeOptions {
  return {...PRESETS[species], seed}
}
