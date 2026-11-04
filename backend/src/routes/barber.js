const r = require('express').Router();
const { Shop, User, Customer, Service, Appointment, Invoice } = require('../models');
const { auth } = require('../middleware/auth');
const { wrap, pick, need, today } = require('../utils/helpers');
const { hasConflict } = require('../utils/slots');
const { emitUser } = require('../sockets');
const { sendWhatsApp } = require('../services/whatsapp');
r.use(auth('barber'));

r.get('/profile', wrap(async (req, res) => {
  const u = req.user;
  res.json({
    user: { id: u._id, name: u.name, mobile: u.mobile, email: u.email, role: u.role, avatarUrl: u.avatarUrl },
    shop: req.shop
  });
}));

r.patch('/profile', wrap(async (req, res) => {
  const { name, email, avatarUrl } = req.body;
  if (name) req.user.name = name;
  if (email !== undefined) req.user.email = email;
  if (avatarUrl !== undefined) req.user.avatarUrl = avatarUrl;
  await req.user.save();
  res.json({
    user: { id: req.user._id, name: req.user.name, mobile: req.user.mobile, email: req.user.email, role: req.user.role, avatarUrl: req.user.avatarUrl },
    message: 'Profile updated successfully'
  });
}));

r.patch('/shop', wrap(async (req, res) => {
  const allowed = ['name', 'ownerName', 'mobile', 'email', 'address', 'city', 'openMin', 'closeMin', 'holidays', 'logoUrl', 'bannerUrl', 'description'];
  const updateData = pick(req.body, allowed);
  if (updateData.openMin !== undefined) updateData.openMin = Number(updateData.openMin);
  if (updateData.closeMin !== undefined) updateData.closeMin = Number(updateData.closeMin);
  if (Array.isArray(req.body.holidays)) updateData.holidays = req.body.holidays.map(Number);
  const shop = await Shop.findByIdAndUpdate(req.shopId, { $set: updateData }, { new: true });
  res.json({ shop, message: 'Store details updated successfully' });
}));
const crud = (path, Model, fields, filter = {}) => {
  r.get(path, wrap(async (req, res) => res.json(await Model.find({ shopId: req.shopId, ...filter }).sort('-createdAt').limit(500))));
  r.post(path, wrap(async (req, res) => res.status(201).json({ data: await Model.create({ ...pick(req.body, fields), shopId: req.shopId }), message: 'Saved' })));
  r.patch(path + '/:id', wrap(async (req, res) => res.json(await Model.findOneAndUpdate({ _id: req.params.id, shopId: req.shopId }, pick(req.body, fields), { new: true }))));
  r.delete(path + '/:id', wrap(async (req, res) => { await Model.findOneAndUpdate({ _id: req.params.id, shopId: req.shopId }, Model === Customer ? { deleted: true } : { active: false }); res.json({ message: 'Removed' }); }));
};
crud('/customers', Customer, ['name', 'mobile', 'email', 'dob', 'gender', 'notes'], { deleted: false });
crud('/services', Service, ['name', 'description', 'price', 'duration', 'active']);
r.get('/shop', wrap(async (req, res) => res.json({ shop: req.shop, customerLink: `${process.env.CLIENT_URL || 'http://localhost:5173'}/s/${req.shop.shopCode}` })));
r.get('/dashboard', wrap(async (req, res) => {
  const s = req.shopId, d = today(), m = d.slice(0, 7);
  const cnt = (st) => Appointment.countDocuments({ shopId: s, date: d, ...(st ? { status: st } : {}) });
  const sum = async (from) => (await Invoice.aggregate([{ $match: { shopId: s, createdAt: { $gte: from } } }, { $group: { _id: null, t: { $sum: '$total' } } }]))[0]?.t || 0;
  const [total, completed, pending, cancelled, customers, todaySales, monthSales] = await Promise.all([cnt(), cnt('completed'), Appointment.countDocuments({ shopId: s, status: 'pending' }), cnt('cancelled'), Customer.countDocuments({ shopId: s, deleted: false }), sum(new Date(d)), sum(new Date(m + '-01'))]);
  res.json({ total, completed, pending, cancelled, customers, todaySales, monthSales });
}));
r.get('/appointments', wrap(async (req, res) => res.json(await Appointment.find({ shopId: req.shopId }).populate('customerId', 'name mobile').sort('-date -startMin').limit(200))));
r.post('/appointments', wrap(async (req, res) => {
  need(req.body, ['customerId', 'serviceId', 'date', 'startMin']);
  const [svc, cust] = await Promise.all([Service.findOne({ _id: req.body.serviceId, shopId: req.shopId }), Customer.findOne({ _id: req.body.customerId, shopId: req.shopId })]);
  if (!svc || !cust) return res.status(404).json({ message: 'Service or customer not found in your shop' });
  const start = Number(req.body.startMin), end = start + svc.duration;
  const booked = await Appointment.find({ shopId: req.shopId, date: req.body.date, blocking: true });
  if (hasConflict(booked, start, end)) return res.status(409).json({ message: 'Time slot already booked' });
  const a = await Appointment.create({ shopId: req.shopId, customerId: cust._id, serviceId: svc._id, serviceName: svc.name, price: svc.price, date: req.body.date, startMin: start, endMin: end, status: 'confirmed', staffName: req.body.staffName });
  res.status(201).json({ data: a, message: 'Appointment created' });
}));
r.patch('/appointments/:id', wrap(async (req, res) => {
  const ok = ['confirmed', 'in_progress', 'cancelled', 'rejected', 'no_show', 'completed'];
  if (!ok.includes(req.body.status)) return res.status(400).json({ message: 'Invalid status' });
  const a = await Appointment.findOne({ _id: req.params.id, shopId: req.shopId }).populate('customerId');
  if (!a) return res.status(404).json({ message: 'Not found' });
  a.status = req.body.status; await a.save();
  if (a.customerId.userId) emitUser(a.customerId.userId, 'booking:updated', { id: a._id, status: a.status });
  if (a.status === 'confirmed') sendWhatsApp(a.customerId.mobile, `Your booking at ${req.shop.name} on ${a.date} is confirmed.`);
  res.json({ data: a, message: 'Status: ' + a.status });
}));
r.post('/invoices', wrap(async (req, res) => {
  need(req.body, ['appointmentId']);
  const a = await Appointment.findOne({ _id: req.body.appointmentId, shopId: req.shopId });
  if (!a) return res.status(404).json({ message: 'Not found' });
  const discount = Number(req.body.discount || 0), taxPct = Number(req.body.taxPct || 0);
  const total = Math.max(0, (a.price - discount) * (1 + taxPct / 100));
  const inv = await Invoice.create({ shopId: req.shopId, appointmentId: a._id, customerId: a.customerId, items: [{ name: a.serviceName, price: a.price }], discount, taxPct, total, method: req.body.method || 'cash' });
  a.status = 'completed'; await a.save();
  await Customer.updateOne({ _id: a.customerId, shopId: req.shopId }, { $inc: { loyaltyPoints: Math.floor(total / 100) } });
  res.status(201).json({ data: inv, message: 'Bill generated: ₹' + total });
}));
r.get('/invoices', wrap(async (req, res) => res.json(await Invoice.find({ shopId: req.shopId }).populate('customerId', 'name').sort('-createdAt').limit(200))));
module.exports = r;
