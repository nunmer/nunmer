import { test } from 'node:test';
import assert from 'node:assert/strict';
import { isValidLogin, addGuest } from '../scripts/guestbook.mjs';
import { placeGuests } from '../scripts/render/footer.mjs';

test('accepts real GitHub logins', () => {
  for (const login of ['nunmer', 'a', 'sindre-sorhus', 'X9', 'a'.repeat(39)]) assert.ok(isValidLogin(login), login);
});

test('rejects anything that is not a GitHub login', () => {
  for (const bad of ['', '-lead', 'trail-', 'dou--ble', 'a'.repeat(40), '<script>', 'a b', 'x"y', '$(rm -rf)', null, undefined, 42]) {
    assert.equal(isValidLogin(bad), false, String(bad));
  }
});

test('addGuest appends without mutating and dedupes case-insensitively', () => {
  const original = [{ login: 'Alice', at: 't0' }];
  const { guests, added } = addGuest(original, 'bob', 't1');
  assert.equal(added, true);
  assert.deepEqual(guests.map((g) => g.login), ['Alice', 'bob']);
  assert.equal(original.length, 1);
  assert.equal(addGuest(guests, 'alice').added, false);
});

test('addGuest throws on an invalid login', () => {
  assert.throws(() => addGuest([], '<img src=x>'), /invalid login/);
});

test('placeGuests keeps stars apart and caps the count', () => {
  const guests = Array.from({ length: 60 }, (_, i) => ({ login: `user${i}`, at: 't' }));
  const placed = placeGuests(guests);
  assert.ok(placed.length <= 40);
  for (let i = 0; i < placed.length; i++) {
    for (let j = i + 1; j < placed.length; j++) {
      const apart = Math.abs(placed[i].x - placed[j].x) > 120 || Math.abs(placed[i].y - placed[j].y) > 28;
      assert.ok(apart, `${placed[i].login} overlaps ${placed[j].login}`);
    }
  }
});
