const r = require('express').Router();
const bcrypt = require('bcryptjs'); const jwt = require('jsonwebtoken'); const crypto = require('crypto');
const { User, Shop, Customer, ShopRequest } = require('../models');
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
r.get('/lookup/:mobile', wrap(async (req, res) => {
  const mobile = String(req.params.mobile || '').replace(/\D/g, '').slice(-10);
  if (mobile.length !== 10) return res.status(400).json({ exists: false, message: 'Invalid mobile number' });

  const u = await User.findOne({ mobile }).select('role name shopId active');
  if (u) {
    let shopName = null;
    let shopCode = null;
    if (u.shopId) {
      const s = await Shop.findById(u.shopId).select('name shopCode');
      shopName = s?.name;
      shopCode = s?.shopCode;
    }
    return res.json({
      exists: true,
      role: u.role,
      name: u.name,
      active: u.active,
      shopName,
      shopCode
    });
  }

  const shopReq = await ShopRequest.findOne({ mobile }).sort('-createdAt').select('shopName status rejectionReason');
  if (shopReq) {
    return res.json({
      exists: false,
      shopRequest: {
        status: shopReq.status,
        shopName: shopReq.shopName,
        reason: shopReq.rejectionReason
      }
    });
  }

  res.json({ exists: false });
}));

r.post('/login', wrap(async (req, res) => {
  need(req.body, ['mobile', 'password']);
  const input = String(req.body.mobile || '').trim();
  const password = String(req.body.password || '').trim();
  const u = await User.findOne({
    $or: [{ mobile: input }, { email: input.toLowerCase() }]
  });
  if (!u) {
    const pendingReq = await ShopRequest.findOne({ mobile: input, status: 'pending' });
    if (pendingReq) {
      return res.status(403).json({
        message: 'Your shop registration request is pending approval by Super Admin. You will receive a WhatsApp message once approved.'
      });
    }
    const rejectedReq = await ShopRequest.findOne({ mobile: input, status: 'rejected' });
    if (rejectedReq) {
      return res.status(403).json({
        message: `Your shop registration request was not approved: ${rejectedReq.rejectionReason || 'Please contact support.'}`
      });
    }
    return res.status(401).json({ message: 'Invalid mobile or password' });
  }
  if (!u.active) return res.status(403).json({ message: 'Your account is deactivated. Please contact administrator.' });
  if (!(await bcrypt.compare(password, u.passwordHash))) return res.status(401).json({ message: 'Invalid mobile or password' });
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
r.post('/register-shop', wrap(async (req, res) => {
  need(req.body, ['shopName', 'ownerName', 'mobile', 'password']);
  const mobile = String(req.body.mobile || '').replace(/\D/g, '').slice(-10);
  if (mobile.length !== 10) {
    return res.status(400).json({ message: 'Please enter a valid 10-digit mobile number' });
  }
  if (String(req.body.password).length < 6) {
    return res.status(400).json({ message: 'Password must be at least 6 characters' });
  }

  const existingUser = await User.findOne({ mobile });
  if (existingUser) {
    return res.status(409).json({ message: 'This mobile number is already registered. Please log in with your credentials.' });
  }

  const existingReq = await ShopRequest.findOne({ mobile, status: 'pending' });
  if (existingReq) {
    return res.status(409).json({ message: 'A shop registration request for this mobile is already pending approval by Super Admin.' });
  }

  const passwordHash = await bcrypt.hash(String(req.body.password), 10);
  const shopReq = await ShopRequest.create({
    shopName: String(req.body.shopName).trim(),
    ownerName: String(req.body.ownerName).trim(),
    mobile,
    email: req.body.email ? String(req.body.email).trim().toLowerCase() : undefined,
    city: req.body.city ? String(req.body.city).trim() : undefined,
    address: req.body.address ? String(req.body.address).trim() : undefined,
    passwordHash,
    status: 'pending'
  });

  res.status(201).json({
    message: 'Shop registration request submitted successfully! Super Admin will review your request and you will receive a WhatsApp message once approved.',
    requestId: shopReq._id
  });
}));
module.exports = r;
