// The target shape the tree has to fit inside, seen from the front.
// Shapes are polygons in the tree's own x/y plane (z is depth), so scoring
// doesn't depend on screen size or camera. This is the same as the shadow
// a light shining straight at the tree would cast on a wall behind it.

export type Point2 = readonly [x: number, y: number]

export type Shape = {
  readonly points: readonly Point2[]
}

/** Even-odd test: whether a point is inside a polygon (works for concave). */
export function contains(shape: Shape, [x, y]: Point2): boolean {
  const pts = shape.points
  let inside = false
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    const a = pts[i]
    const b = pts[j]
    if (!a || !b) continue
    const crosses =
      a[1] > y !== b[1] > y &&
      x < ((b[0] - a[0]) * (y - a[1])) / (b[1] - a[1]) + a[0]
    if (crosses) inside = !inside
  }
  return inside
}

/** An ellipse as a polygon. Used as a placeholder until shapes are generated. */
export function ellipse(
  center: Point2,
  radiusX: number,
  radiusY: number,
  steps: number = 48,
): Shape {
  const points: Point2[] = []
  for (let i = 0; i < steps; i++) {
    const angle = (i / steps) * Math.PI * 2
    points.push([
      center[0] + Math.cos(angle) * radiusX,
      center[1] + Math.sin(angle) * radiusY,
    ])
  }
  return {points}
}
