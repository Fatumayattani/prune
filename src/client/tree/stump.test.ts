import assert from 'node:assert/strict'
import {test} from 'node:test'
import {generateTree} from '../../shared/tree/model.ts'
import {treeOptions} from '../../shared/tree/species.ts'
import {stumpPose} from './stump.ts'

const model = generateTree(treeOptions('oak', 4))

test('the trunk has no stump', () => {
  assert.equal(stumpPose(model, 0), undefined)
})

test('a continuing branch is cut right where it starts', () => {
  // In deciduous trees the first child continues from the end of its parent.
  const trunk = model.branches[0]
  const end = trunk?.sections.at(-1)
  const continuation = model.branches.find(
    b => b.parent === 0 && end && b.sections[0]?.origin.equals(end.origin),
  )
  assert.ok(continuation)
  const pose = stumpPose(model, continuation.id)
  assert.ok(pose)
  assert.ok(pose.position.distanceTo(end?.origin ?? pose.position) < 1e-9)
})

test('a side branch is cut at its parent bark, not inside the parent', () => {
  let sideBranches = 0
  for (const branch of model.branches) {
    const pose = stumpPose(model, branch.id)
    const base = branch.sections[0]
    const parentEnd =
      branch.parent === undefined
        ? undefined
        : model.branches[branch.parent]?.sections.at(-1)
    if (!pose || !base || !parentEnd) continue
    assert.ok(Math.abs(pose.normal.length() - 1) < 1e-9)
    assert.ok(pose.radius > 0)
    if (base.origin.equals(parentEnd.origin)) continue
    // Side branches start on the parent's centre line; the cut moves out.
    sideBranches += 1
    assert.ok(pose.position.distanceTo(base.origin) > 0)
  }
  assert.ok(sideBranches > 0)
})
