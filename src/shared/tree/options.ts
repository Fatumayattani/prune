// Tree generation options, matching the EZ-Tree option format
// (MIT, Daniel Greenheck). Trellis options are dropped.

export const TreeType = {
  Deciduous: 'deciduous',
  Evergreen: 'evergreen',
} as const
export type TreeType = (typeof TreeType)[keyof typeof TreeType]

export const BarkType = {Birch: 'birch', Oak: 'oak', Pine: 'pine'} as const
export type BarkType = (typeof BarkType)[keyof typeof BarkType]

export const LeafType = {
  Ash: 'ash',
  Aspen: 'aspen',
  Oak: 'oak',
  Pine: 'pine',
} as const
export type LeafType = (typeof LeafType)[keyof typeof LeafType]

export const Billboard = {Single: 'single', Double: 'double'} as const
export type Billboard = (typeof Billboard)[keyof typeof Billboard]

/** Values keyed by branch level (0 = trunk). */
export type PerLevel = Readonly<Record<string, number>>

export type TreeOptions = {
  readonly seed: number
  readonly type: TreeType
  readonly bark: {
    readonly type: BarkType
    readonly tint: number
    readonly flatShading: boolean
    readonly textured: boolean
    readonly textureScale: {readonly x: number; readonly y: number}
  }
  readonly branch: {
    readonly levels: number
    readonly angle: PerLevel
    readonly children: PerLevel
    readonly force: {
      readonly direction: {
        readonly x: number
        readonly y: number
        readonly z: number
      }
      readonly strength: number
    }
    readonly gnarliness: PerLevel
    readonly length: PerLevel
    readonly radius: PerLevel
    readonly sections: PerLevel
    readonly segments: PerLevel
    readonly start: PerLevel
    readonly taper: PerLevel
    readonly twist: PerLevel
  }
  readonly leaves: {
    readonly type: LeafType
    readonly billboard: Billboard
    readonly angle: number
    readonly count: number
    readonly start: number
    readonly size: number
    readonly sizeVariance: number
    readonly tint: number
    readonly alphaTest: number
  }
}

/** Reads a per-level value, failing loudly if the preset is missing one. */
export function atLevel(values: PerLevel, level: number): number {
  const value = values[level]
  if (value === undefined) throw Error(`missing option for level ${level}`)
  return value
}
