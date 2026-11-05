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
  const s = await shopByCode(req.query.code);
  if (!s) return res.status(404).json({ message: 'Shop not found' });

  let duration = 30;
  if (req.query.duration && Number(req.query.duration) > 0) {
    duration = Number(req.query.duration);
  } else if (req.query.serviceIds) {
    const rawIds = Array.isArray(req.query.serviceIds)
      ? req.query.serviceIds
      : String(req.query.serviceIds).split(',').map((id) => id.trim()).filter(Boolean);
    const svcs = await Service.find({ _id: { $in: rawIds }, shopId: s._id });
    if (svcs.length > 0) {
      duration = svcs.reduce((acc, x) => acc + (x.duration || 30), 0);
    }
  } else if (req.query.serviceId) {
    const svc = await Service.findOne({ _id: req.query.serviceId, shopId: s._id });
    if (!svc) return res.status(404).json({ message: 'Service not found' });
    duration = svc.duration || 30;
  }

  if (s.holidays && s.holidays.includes(new Date(req.query.date).getDay())) return res.json([]);
  const booked = await Appointment.find({ shopId: s._id, date: req.query.date, blocking: true });
  res.json(genSlots({ openMin: s.openMin, closeMin: s.closeMin, duration, booked }));
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
  need(req.body, ['date', 'startMin']);
  let svcIds = [];
  if (Array.isArray(req.body.serviceIds) && req.body.serviceIds.length) {
    svcIds = req.body.serviceIds;
  } else if (typeof req.body.serviceIds === 'string' && req.body.serviceIds.trim()) {
    svcIds = req.body.serviceIds.split(',').map((id) => id.trim()).filter(Boolean);
  } else if (req.body.serviceId) {
    svcIds = [req.body.serviceId];
  } else {
    return res.status(400).json({ message: 'Please select at least one service' });
  }

  const [svcs, cust] = await Promise.all([
    Service.find({ _id: { $in: svcIds }, shopId: req.shopId, active: true }),
    Customer.findOne({ shopId: req.shopId, userId: req.user._id })
  ]);
  if (!svcs.length || !cust) return res.status(404).json({ message: 'Selected services or customer record not found' });

  const totalDuration = svcs.reduce((sum, s) => sum + (s.duration || 30), 0);
  const totalPrice = svcs.reduce((sum, s) => sum + (s.price || 0), 0);
  const serviceNames = svcs.map((s) => s.name).join(' + ');

  const start = Number(req.body.startMin);
  const end = start + totalDuration;
  const booked = await Appointment.find({ shopId: req.shopId, date: req.body.date, blocking: true });
  if (hasConflict(booked, start, end)) {
    return res.status(409).json({ message: 'Time slot conflict. Total duration overlaps an existing booking. Please pick another slot.' });
  }

  const a = await Appointment.create({
    shopId: req.shopId,
    customerId: cust._id,
    serviceId: svcs[0]._id,
    serviceName: serviceNames,
    services: svcs.map((s) => ({ serviceId: s._id, name: s.name, price: s.price, duration: s.duration })),
    duration: totalDuration,
    price: totalPrice,
    date: req.body.date,
    startMin: start,
    endMin: end,
    status: 'pending',
    source: 'online'
  });

  emitShop(req.shopId, 'booking:new', { id: a._id, customer: cust.name, date: a.date, startMin: a.startMin });
  res.status(201).json({ data: a, message: `Booking request sent for ${serviceNames} (${totalDuration}m, ₹${totalPrice}).` });
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
