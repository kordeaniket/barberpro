const test = require('node:test'); const assert = require('node:assert');
const { genSlots, hasConflict } = require('../src/utils/slots');
test('detects overlapping booking', () => assert.ok(hasConflict([{ startMin: 600, endMin: 630 }], 615, 645)));
test('allows back-to-back booking', () => assert.ok(!hasConflict([{ startMin: 600, endMin: 630 }], 630, 660)));
test('slots mark booked time unavailable', () => {
  const s = genSlots({ openMin: 600, closeMin: 720, duration: 30, booked: [{ startMin: 600, endMin: 630 }] });
  assert.equal(s[0].available, false); assert.equal(s[1].available, true);
});
