// Finds which branch a tap is aimed at, in screen space. Thin branches are
// hard to hit exactly, so the nearest branch within a finger's reach wins.

export type Point = readonly [x: number, y: number]

export type Target = {
  readonly branch: number
  /** A polyline along the branch, or a single point for a leaf. */
  readonly points: readonly Point[]
}

export function pickBranch(
  targets: readonly Target[],
  tap: Point,
  maxDistance: number,
): number | undefined {
  let best: number | undefined
  let bestDistance = maxDistance
  for (const target of targets) {
    const distance = distanceToPolyline(tap, target.points)
    if (distance <= bestDistance) {
      bestDistance = distance
      best = target.branch
    }
  }
  return best
}

function distanceToPolyline(p: Point, points: readonly Point[]): number {
  const first = points[0]
  if (!first) return Number.POSITIVE_INFINITY
  if (points.length === 1) return Math.hypot(p[0] - first[0], p[1] - first[1])
  let min = Number.POSITIVE_INFINITY
  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1]
    const b = points[i]
    if (a && b) min = Math.min(min, distanceToSegment(p, a, b))
  }
  return min
}

function distanceToSegment(p: Point, a: Point, b: Point): number {
  const dx = b[0] - a[0]
  const dy = b[1] - a[1]
  const lengthSq = dx * dx + dy * dy
  const t =
    lengthSq === 0
      ? 0
      : Math.max(
          0,
          Math.min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / lengthSq),
        )
  return Math.hypot(p[0] - (a[0] + t * dx), p[1] - (a[1] + t * dy))
}
