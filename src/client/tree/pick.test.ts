import assert from 'node:assert/strict'
import {test} from 'node:test'
import {pickBranch, type Target} from './pick.ts'

const targets: Target[] = [
  {
    branch: 1,
    points: [
      [0, 0],
      [100, 0],
    ],
  },
  {
    branch: 2,
    points: [
      [0, 50],
      [100, 50],
    ],
  },
  {branch: 3, points: [[200, 200]]},
]

test('picks the nearest branch', () => {
  assert.equal(pickBranch(targets, [50, 10], 30), 1)
  assert.equal(pickBranch(targets, [50, 40], 30), 2)
})

test('measures distance to the branch line, not just its ends', () => {
  assert.equal(pickBranch(targets, [50, 4], 5), 1)
})

test('picks a branch through one of its leaves', () => {
  assert.equal(pickBranch(targets, [205, 195], 30), 3)
})

test('ignores taps too far from any branch', () => {
  assert.equal(pickBranch(targets, [500, 500], 30), undefined)
})
