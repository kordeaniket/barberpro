const r = require('express').Router();
const { Shop, Service, Customer, Appointment } = require('../models');
const { auth } = require('../middleware/auth');
const { wrap, need } = require('../utils/helpers');
const { genSlots, hasConflict } = require('../utils/slots');
const { emitShop } = require('../sockets');
const shopByCode = async (code) => Shop.findOne({ shopCode: code, status: 'active' });
r.get('/public/shop/:code', wrap(async (req, res) => {
  const s = await shopByCode(req.params.code); if (!s) return res.status(404).json({ message: 'Shop not found' });
  res.json({
    shop: {
      name: s.name, address: s.address, city: s.city, openMin: s.openMin,
      closeMin: s.closeMin, shopCode: s.shopCode, logoUrl: s.logoUrl,
      bannerUrl: s.bannerUrl, description: s.description
    },
    services: await Service.find({ shopId: s._id, active: true })
  });
}));
r.get('/public/slots', wrap(async (req, res) => {
  const s = await shopByCode(req.query.code); const svc = s && await Service.findOne({ _id: req.query.serviceId, shopId: s._id });
  if (!svc) return res.status(404).json({ message: 'Not found' });
  if (s.holidays.includes(new Date(req.query.date).getDay())) return res.json([]);
  const booked = await Appointment.find({ shopId: s._id, date: req.query.date, blocking: true });
  res.json(genSlots({ openMin: s.openMin, closeMin: s.closeMin, duration: svc.duration, booked }));
}));
r.use(auth('customer'));

r.get('/profile', wrap(async (req, res) => {
  const cust = await Customer.findOne({ shopId: req.shopId, userId: req.user._id });
  res.json({
    user: { id: req.user._id, name: req.user.name, mobile: req.user.mobile, email: req.user.email, avatarUrl: req.user.avatarUrl },
    customer: cust,
    shop: { name: req.shop.name, city: req.shop.city, shopCode: req.shop.shopCode, logoUrl: req.shop.logoUrl }
  });
}));

r.patch('/profile', wrap(async (req, res) => {
  const { name, email, dob, gender, notes, avatarUrl } = req.body;
  if (name) req.user.name = name;
  if (email !== undefined) req.user.email = email;
  if (avatarUrl !== undefined) req.user.avatarUrl = avatarUrl;
  await req.user.save();
  const cust = await Customer.findOneAndUpdate(
    { shopId: req.shopId, userId: req.user._id },
    { $set: { ...(name && { name }), ...(email !== undefined && { email }), ...(dob && { dob }), ...(gender && { gender }), ...(notes && { notes }) } },
    { new: true }
  );
  res.json({
    user: { id: req.user._id, name: req.user.name, mobile: req.user.mobile, email: req.user.email, avatarUrl: req.user.avatarUrl },
    customer: cust,
    message: 'Profile updated successfully'
  });
}));

r.post('/bookings', wrap(async (req, res) => {
  need(req.body, ['serviceId', 'date', 'startMin']);
  const svc = await Service.findOne({ _id: req.body.serviceId, shopId: req.shopId, active: true });
  const cust = await Customer.findOne({ shopId: req.shopId, userId: req.user._id });
  if (!svc || !cust) return res.status(404).json({ message: 'Not found' });
  const start = Number(req.body.startMin), end = start + svc.duration;
  const booked = await Appointment.find({ shopId: req.shopId, date: req.body.date, blocking: true });
  if (hasConflict(booked, start, end)) return res.status(409).json({ message: 'Slot just got booked, pick another' });
  const a = await Appointment.create({ shopId: req.shopId, customerId: cust._id, serviceId: svc._id, serviceName: svc.name, price: svc.price, date: req.body.date, startMin: start, endMin: end, status: 'pending', source: 'online' });
  emitShop(req.shopId, 'booking:new', { id: a._id, customer: cust.name, date: a.date, startMin: a.startMin });
  res.status(201).json({ data: a, message: 'Request sent. Waiting for shop confirmation.' });
}));
r.get('/bookings', wrap(async (req, res) => {
  const c = await Customer.findOne({ shopId: req.shopId, userId: req.user._id });
  res.json(await Appointment.find({ shopId: req.shopId, customerId: c?._id }).sort('-date -startMin'));
}));
r.patch('/bookings/:id/cancel', wrap(async (req, res) => {
  const c = await Customer.findOne({ shopId: req.shopId, userId: req.user._id });
  const a = await Appointment.findOne({ _id: req.params.id, shopId: req.shopId, customerId: c?._id });
  if (!a) return res.status(404).json({ message: 'Not found' });
  a.status = 'cancelled'; await a.save(); emitShop(req.shopId, 'booking:cancelled', { id: a._id });
  res.json({ data: a, message: 'Booking cancelled' });
}));
module.exports = r;
