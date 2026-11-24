import assert from 'node:assert/strict'
import {test} from 'node:test'
import {remainingLeafCount, subtree} from './cut.ts'
import {CutHistory} from './history.ts'
import {generateTree} from './model.ts'
import {treeOptions} from './species.ts'

const model = generateTree(treeOptions('oak', 11))

function levelOneBranch(): number {
  const branch = model.branches.find(b => b.level === 1)
  assert.ok(branch)
  return branch.id
}

test('the trunk cannot be cut', () => {
  const history = new CutHistory(model)
  assert.equal(history.canCut(0), false)
  assert.equal(history.cut(0), false)
  assert.equal(history.cuts.length, 0)
})

test('a cut removes the branch and everything growing from it', () => {
  const history = new CutHistory(model)
  const id = levelOneBranch()
  assert.ok(history.cut(id))
  assert.deepEqual(history.removed, subtree(model, id))
})

test('a branch that is already gone cannot be cut', () => {
  const history = new CutHistory(model)
  const id = levelOneBranch()
  const child = model.branches[id]?.children[0]
  assert.ok(child !== undefined)
  history.cut(id)
  assert.equal(history.canCut(child), false)
  assert.equal(history.cut(child), false)
  assert.equal(history.cuts.length, 1)
})

test('undo restores the last cut', () => {
  const history = new CutHistory(model)
  const all = model.leaves.length
  history.cut(levelOneBranch())
  assert.ok(remainingLeafCount(model, history.removed) < all)

  assert.equal(history.undo(), levelOneBranch())
  assert.equal(history.cuts.length, 0)
  assert.equal(remainingLeafCount(model, history.removed), all)
  assert.equal(history.undo(), undefined, 'nothing left to undo')
})

test('replaying saved cuts gives the same result', () => {
  const first = new CutHistory(model)
  for (const branch of model.branches.filter(b => b.level === 2).slice(0, 3)) {
    first.cut(branch.id)
  }
  const replay = new CutHistory(model, first.cuts)
  assert.deepEqual(replay.cuts, first.cuts)
  assert.deepEqual(replay.removed, first.removed)
})
