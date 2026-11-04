const jwt = require('jsonwebtoken');
const { User, Shop } = require('../models');
const sign = (u) => jwt.sign({ id: u._id, role: u.role }, process.env.JWT_SECRET, { expiresIn: '15m' });
const signRefresh = (u) => jwt.sign({ id: u._id }, process.env.JWT_REFRESH_SECRET, { expiresIn: '7d' });
const fail = (res, s, m, code) => res.status(s).json({ message: m, code });
const auth = (...roles) => async (req, res, next) => {
  try {
    const t = (req.headers.authorization || '').replace('Bearer ', '');
    const p = jwt.verify(t, process.env.JWT_SECRET);
    const u = await User.findById(p.id);
    if (!u || !u.active) return fail(res, 401, 'Account disabled');
    if (roles.length && !roles.includes(u.role)) return fail(res, 403, 'Forbidden');
    if (u.mustChangePassword && !req.originalUrl.includes('change-password')) return fail(res, 403, 'Password change required', 'PASSWORD_CHANGE_REQUIRED');
    if (u.role !== 'superadmin') {
      const shop = await Shop.findById(u.shopId);
      if (!shop || shop.status !== 'active') return fail(res, 403, 'Shop is not active');
      req.shop = shop;
    }
    req.user = u; req.shopId = u.shopId; next();
  } catch (e) { fail(res, 401, 'Unauthorized'); }
};
module.exports = { auth, sign, signRefresh };
