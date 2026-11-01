import { test } from 'node:test'
import assert from 'node:assert/strict'
import { deckKey, imageKey, imagePrefix, isDeckStale, sourceStamp } from '../src/features/offline/offlineModel.js'

const w = (id, ms) => ({ id, updatedAt: new Date(ms) })

test('keys are scoped by user and chapter so decks never mix', () => {
  assert.equal(deckKey('u1', 'c1'), 'u1:c1')
  assert.ok(imageKey('u1', 'c1', 'w1').startsWith(imagePrefix('u1', 'c1')))
  assert.ok(!imageKey('u1', 'c10', 'w1').startsWith(imagePrefix('u1', 'c1')))
})

test('an unchanged chapter is not stale', () => {
  const words = [w('a', 1000), w('b', 2000)]
  assert.equal(isDeckStale({ stamp: sourceStamp(words) }, words), false)
})

test('adding, editing, deleting or reordering words makes the copy stale', () => {
  const words = [w('a', 1000), w('b', 2000)]
  const meta = { stamp: sourceStamp(words) }
  assert.equal(isDeckStale(meta, [...words, w('c', 3000)]), true)
  assert.equal(isDeckStale(meta, [w('a', 1000), w('b', 2500)]), true)
  assert.equal(isDeckStale(meta, [words[0]]), true)
  assert.equal(isDeckStale(meta, [words[1], words[0]]), true)
})
