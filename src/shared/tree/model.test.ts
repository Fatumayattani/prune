import assert from 'node:assert/strict'
import {test} from 'node:test'
import {remainingLeafCount, removedBranches, subtree} from './cut.ts'
import {generateTree} from './model.ts'
import {SPECIES, treeOptions} from './species.ts'

test('same species and seed give the same tree', () => {
  for (const species of SPECIES) {
    const a = generateTree(treeOptions(species, 20261124))
    const b = generateTree(treeOptions(species, 20261124))
    assert.equal(a.branches.length, b.branches.length)
    assert.equal(a.leaves.length, b.leaves.length)
    assert.deepEqual(
      a.leaves.map(leaf => leaf.origin.toArray()),
      b.leaves.map(leaf => leaf.origin.toArray()),
    )
  }
})

test('different seeds give different trees', () => {
  const a = generateTree(treeOptions('oak', 1))
  const b = generateTree(treeOptions('oak', 2))
  assert.notDeepEqual(
    a.leaves.map(leaf => leaf.origin.toArray()),
    b.leaves.map(leaf => leaf.origin.toArray()),
  )
})

test('generation matches the known output for oak seed 1', () => {
  // Guards against accidental changes to the generator or random numbers,
  // which would make the client and server disagree about a tree.
  const model = generateTree(treeOptions('oak', 1))
  assert.equal(model.branches.length, 81)
  assert.equal(model.leaves.length, 900)
})

test('every branch is linked to its parent and children', () => {
  for (const species of SPECIES) {
    const model = generateTree(treeOptions(species, 7))
    model.branches.forEach((branch, index) => {
      assert.equal(branch.id, index)
      if (branch.parent === undefined) {
        assert.equal(branch.id, 0, 'only the trunk has no parent')
      } else {
        assert.ok(model.branches[branch.parent]?.children.includes(branch.id))
      }
      for (const child of branch.children) {
        assert.equal(model.branches[child]?.parent, branch.id)
      }
    })
    for (const leaf of model.leaves) {
      assert.ok(model.branches[leaf.branch], 'leaf belongs to a real branch')
    }
  }
})

test('cutting a branch removes it and everything growing from it', () => {
  const model = generateTree(treeOptions('oak', 3))
  const branch = model.branches.find(b => b.level === 1)
  assert.ok(branch)

  const removed = subtree(model, branch.id)
  assert.ok(removed.has(branch.id))
  for (const id of removed) {
    // Walk up from each removed branch: it must reach the cut branch.
    let current: number | undefined = id
    while (current !== undefined && current !== branch.id) {
      current = model.branches[current]?.parent
    }
    assert.equal(current, branch.id)
  }
})

test('cutting the trunk removes the whole tree', () => {
  const model = generateTree(treeOptions('ash', 5))
  const removed = removedBranches(model, [0])
  assert.equal(removed.size, model.branches.length)
  assert.equal(remainingLeafCount(model, removed), 0)
})

test('cuts only ever remove leaves', () => {
  const model = generateTree(treeOptions('pine', 9))
  const all = model.leaves.length
  const first = model.branches[1]
  assert.ok(first)
  const one = remainingLeafCount(model, removedBranches(model, [first.id]))
  const twice = remainingLeafCount(
    model,
    removedBranches(model, [first.id, first.id]),
  )
  assert.ok(one < all)
  assert.equal(twice, one, 'cutting the same branch twice changes nothing')
})
