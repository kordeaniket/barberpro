// Tenant isolation is enforced in routes by always scoping queries with req.shopId (taken from the DB user, never from the request body).
const test = require('node:test'); const assert = require('node:assert'); const fs = require('fs');
test('barber routes never read shopId from request input', () => {
  const src = fs.readFileSync(__dirname + '/../src/routes/barber.js', 'utf8');
  assert.ok(!/req\.(body|query|params)\.shopId/.test(src));
});
