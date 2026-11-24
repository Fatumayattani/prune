import assert from 'node:assert/strict'
import {test} from 'node:test'
import {generateTree} from '../tree/model.ts'
import {treeOptions} from '../tree/species.ts'
import {leafCenter, OVER_TARGET_PENALTY, score} from './score.ts'
import {contains, ellipse, type Shape} from './shape.ts'

const square: Shape = {
  points: [
    [0, 0],
    [10, 0],
    [10, 10],
    [0, 10],
  ],
}

// An L shape: the top-right quarter is cut away.
const lShape: Shape = {
  points: [
    [0, 0],
    [10, 0],
    [10, 5],
    [5, 5],
    [5, 10],
    [0, 10],
  ],
}

test('contains works for simple and concave shapes', () => {
  assert.equal(contains(square, [5, 5]), true)
  assert.equal(contains(square, [11, 5]), false)
  assert.equal(contains(lShape, [2, 8]), true)
  assert.equal(contains(lShape, [8, 8]), false, 'inside the cut-away corner')
})

const model = generateTree(treeOptions('oak', 21))

/** A shape that comfortably holds the whole tree. */
function bigShape(): Shape {
  const xs = model.leaves.map(leaf => leafCenter(leaf).x)
  const ys = model.leaves.map(leaf => leafCenter(leaf).y)
  const pad = 5
  return {
    points: [
      [Math.min(...xs) - pad, Math.min(...ys) - pad],
      [Math.max(...xs) + pad, Math.min(...ys) - pad],
      [Math.max(...xs) + pad, Math.max(...ys) + pad],
      [Math.min(...xs) - pad, Math.max(...ys) + pad],
    ],
  }
}

test('an uncut tree inside a big shape fits with full marks', () => {
  const result = score(model, [], bigShape())
  assert.equal(result.fits, true)
  assert.equal(result.outside, 0)
  assert.equal(result.kept, result.total)
  assert.equal(result.points, 100)
})

test('a tree that pokes out of the shape scores nothing', () => {
  const tiny = ellipse([0, 10], 1, 1)
  const result = score(model, [], tiny)
  assert.equal(result.fits, false)
  assert.ok(result.outside > 0)
  assert.equal(result.points, 0)
})

test('points are the share of leaves kept', () => {
  const branch = model.branches.find(b => b.level === 1)
  assert.ok(branch)
  const result = score(model, [branch.id], bigShape())
  assert.ok(result.kept < result.total)
  assert.equal(result.points, Math.round((result.kept / result.total) * 100))
})

test('each cut over the target costs points', () => {
  const ids = model.branches.filter(b => b.level === 3).map(b => b.id)
  const cuts = ids.slice(0, 3)
  const atTarget = score(model, cuts, bigShape(), 3)
  const overTarget = score(model, cuts, bigShape(), 1)
  assert.equal(atTarget.points - overTarget.points, 2 * OVER_TARGET_PENALTY)
})

test('cutting everything fits but keeps nothing', () => {
  const firstBranches = model.branches.filter(b => b.parent === 0)
  const result = score(
    model,
    firstBranches.map(b => b.id),
    ellipse([0, 10], 1, 1),
  )
  assert.equal(result.kept, 0)
  assert.equal(result.fits, true)
  assert.equal(result.points, 0)
})
