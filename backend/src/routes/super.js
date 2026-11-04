const r = require('express').Router();
const bcrypt = require('bcryptjs');
const { User, Shop, Plan, Customer, Appointment, Invoice } = require('../models');
const { auth } = require('../middleware/auth');
const { wrap, pick, need, rand } = require('../utils/helpers');
r.use(auth('superadmin'));
r.get('/dashboard', wrap(async (req, res) => {
  const [shops, active, barbers, customers, bookings, completed, cancelled, rev, perShop] = await Promise.all([
    Shop.countDocuments(), Shop.countDocuments({ status: 'active' }), User.countDocuments({ role: 'barber' }), Customer.countDocuments(),
    Appointment.countDocuments(), Appointment.countDocuments({ status: 'completed' }), Appointment.countDocuments({ status: 'cancelled' }),
    Invoice.aggregate([{ $group: { _id: null, t: { $sum: '$total' } } }]),
    Invoice.aggregate([{ $group: { _id: '$shopId', sales: { $sum: '$total' } } }, { $lookup: { from: 'shops', localField: '_id', foreignField: '_id', as: 's' } }, { $project: { sales: 1, name: { $arrayElemAt: ['$s.name', 0] } } }]),
  ]);
  res.json({ shops, active, inactive: shops - active, barbers, customers, bookings, completed, cancelled, totalSales: rev[0]?.t || 0, perShop });
}));
r.get('/plans', wrap(async (q, res) => res.json(await Plan.find())));
r.post('/plans', wrap(async (req, res) => { need(req.body, ['name']); res.status(201).json(await Plan.create(req.body)); }));
r.get('/shops', wrap(async (q, res) => res.json(await Shop.find().populate('planId', 'name').sort('-createdAt'))));
r.post('/shops', wrap(async (req, res) => {
  need(req.body, ['name', 'ownerName', 'mobile']);
  if (await User.findOne({ mobile: req.body.mobile })) return res.status(409).json({ message: 'Mobile already in use' });
  const plan = req.body.planId ? await Plan.findById(req.body.planId) : await Plan.findOne({ cycle: 'trial' });
  const ends = new Date(Date.now() + (plan?.cycle === 'trial' ? 14 : 30) * 864e5);
  const shop = await Shop.create({ ...pick(req.body, ['name', 'ownerName', 'mobile', 'email', 'address', 'city', 'openMin', 'closeMin', 'holidays']), planId: plan?._id, subscriptionEnds: ends, shopCode: rand(3).toUpperCase() });
  const temp = rand(4);
  await User.create({ name: shop.ownerName, mobile: shop.mobile, email: shop.email, role: 'barber', shopId: shop._id, passwordHash: await bcrypt.hash(temp, 10), mustChangePassword: true });
  const base = process.env.CLIENT_URL || 'http://localhost:5173';
  res.status(201).json({ shop, message: `Shop created. Login ${shop.mobile} / temp password ${temp} (shown once). Customer link: ${base}/s/${shop.shopCode}` });
}));
r.patch('/shops/:id', wrap(async (req, res) => res.json(await Shop.findByIdAndUpdate(req.params.id, pick(req.body, ['name', 'ownerName', 'email', 'address', 'city', 'status', 'planId', 'openMin', 'closeMin']), { new: true }))));
r.post('/shops/:id/reset-password', wrap(async (req, res) => {
  const temp = rand(4);
  await User.updateOne({ shopId: req.params.id, role: 'barber' }, { passwordHash: await bcrypt.hash(temp, 10), mustChangePassword: true });
  res.json({ message: 'New temporary password: ' + temp });
}));
module.exports = r;
