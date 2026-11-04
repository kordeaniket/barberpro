const jwt = require('jsonwebtoken');
const { Server } = require('socket.io');
const { User } = require('../models');
let io;
function initSockets(server) {
  io = new Server(server, { cors: { origin: process.env.CLIENT_URL || '*' } });
  io.use(async (s, next) => {
    try {
      const p = jwt.verify(s.handshake.auth.token, process.env.JWT_SECRET);
      const u = await User.findById(p.id); if (!u) throw new Error('no user');
      s.user = u; next();
    } catch { next(new Error('unauthorized')); }
  });
  io.on('connection', (s) => {
    const u = s.user; s.join('user:' + u._id);
    if (u.role === 'superadmin') s.join('platform');
    if (u.role === 'barber') s.join('shop:' + u.shopId);
  });
}
const emitShop = (id, ev, d) => io && io.to('shop:' + id).emit(ev, d);
const emitUser = (id, ev, d) => io && io.to('user:' + id).emit(ev, d);
const emitPlatform = (ev, d) => io && io.to('platform').emit(ev, d);
module.exports = { initSockets, emitShop, emitUser, emitPlatform };
