const r = require('express').Router();
const bcrypt = require('bcryptjs'); const jwt = require('jsonwebtoken'); const crypto = require('crypto');
const { User, Shop, Customer } = require('../models');
const { auth, sign, signRefresh } = require('../middleware/auth');
const { wrap, need } = require('../utils/helpers');
const sha = (s) => crypto.createHash('sha256').update(s).digest('hex');
const issue = async (u) => {
  const refreshToken = signRefresh(u); u.refreshHash = sha(refreshToken); await u.save();
  let shop = null;
  if (u.shopId) {
    const s = await Shop.findById(u.shopId).select('name logoUrl shopCode city');
    if (s) shop = { id: s._id, name: s.name, logoUrl: s.logoUrl, shopCode: s.shopCode, city: s.city };
  }
  return {
    token: sign(u),
    refreshToken,
    user: {
      id: u._id,
      name: u.name,
      mobile: u.mobile,
      role: u.role,
      shopId: u.shopId,
      mustChangePassword: u.mustChangePassword,
      shop
    }
  };
};
r.post('/login', wrap(async (req, res) => {
  need(req.body, ['mobile', 'password']);
  const input = String(req.body.mobile || '').trim();
  const password = String(req.body.password || '').trim();
  const u = await User.findOne({
    $or: [{ mobile: input }, { email: input.toLowerCase() }]
  });
  if (!u || !u.active || !(await bcrypt.compare(password, u.passwordHash))) return res.status(401).json({ message: 'Invalid mobile or password' });
  res.json(await issue(u));
}));
r.post('/refresh', wrap(async (req, res) => {
  try {
    const p = jwt.verify(req.body.refreshToken, process.env.JWT_REFRESH_SECRET);
    const u = await User.findById(p.id);
    if (!u || u.refreshHash !== sha(req.body.refreshToken)) throw new Error();
    res.json(await issue(u));
  } catch { res.status(401).json({ message: 'Invalid refresh token' }); }
}));
r.post('/change-password', auth(), wrap(async (req, res) => {
  need(req.body, ['newPassword']);
  if (req.body.newPassword.length < 8) return res.status(400).json({ message: 'Password must be at least 8 characters' });
  req.user.passwordHash = await bcrypt.hash(req.body.newPassword, 10); req.user.mustChangePassword = false; await req.user.save();
  res.json({ message: 'Password changed' });
}));
r.post('/register-customer', wrap(async (req, res) => {
  need(req.body, ['name', 'mobile', 'password', 'shopCode']);
  const shop = await Shop.findOne({ shopCode: req.body.shopCode, status: 'active' });
  if (!shop) return res.status(404).json({ message: 'Shop not found' });
  if (await User.findOne({ mobile: req.body.mobile })) return res.status(409).json({ message: 'Mobile already registered' });
  const u = await User.create({ name: req.body.name, mobile: req.body.mobile, email: req.body.email, role: 'customer', shopId: shop._id, passwordHash: await bcrypt.hash(req.body.password, 10) });
  await Customer.findOneAndUpdate({ shopId: shop._id, mobile: u.mobile }, { shopId: shop._id, mobile: u.mobile, name: u.name, email: u.email, userId: u._id }, { upsert: true });
  res.status(201).json(await issue(u));
}));
module.exports = r;
