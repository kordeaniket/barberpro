const overlaps = (a, b) => a.startMin < b.endMin && b.startMin < a.endMin;
const hasConflict = (booked, start, end) => booked.some((b) => overlaps(b, { startMin: start, endMin: end }));
function genSlots({ openMin, closeMin, duration, booked = [], step = 30 }) {
  const out = [];
  for (let s = openMin; s + duration <= closeMin; s += step) out.push({ startMin: s, endMin: s + duration, available: !hasConflict(booked, s, s + duration) });
  return out;
}
module.exports = { overlaps, hasConflict, genSlots };
