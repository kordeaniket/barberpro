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
r.get('/appointments', wrap(async (req, res) => {
  // Calendar mode or unpaginated full list
  if (req.query.calendar === 'true' || req.query.all === 'true') {
    const list = await Appointment.find({ shopId: req.shopId })
      .populate('customerId', 'name mobile email')
      .sort('-date -startMin');
    return res.json(list);
  }

  const query = { shopId: req.shopId };

  // Status filter
  if (req.query.status && req.query.status !== 'all') {
    if (req.query.status === 'confirmed') {
      query.status = { $in: ['confirmed', 'in_progress'] };
    } else if (req.query.status === 'cancelled') {
      query.status = { $in: ['cancelled', 'rejected', 'no_show'] };
    } else {
      query.status = req.query.status;
    }
  }

  // Date filter
  if (req.query.date && req.query.date !== 'all') {
    query.date = req.query.date;
  }

  // Search filter (client name or mobile or serviceName)
  if (req.query.search && req.query.search.trim()) {
    const sRegex = new RegExp(req.query.search.trim(), 'i');
    const matchingCusts = await Customer.find({
      shopId: req.shopId,
      $or: [{ name: sRegex }, { mobile: sRegex }]
    }).select('_id');
    const custIds = matchingCusts.map((c) => c._id);
    query.$or = [
      { serviceName: sRegex },
      { customerId: { $in: custIds } }
    ];
  }

  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.max(1, Math.min(100, parseInt(req.query.limit, 10) || 10));
  const skip = (page - 1) * limit;

  const [total, appointments] = await Promise.all([
    Appointment.countDocuments(query),
    Appointment.find(query)
      .populate('customerId', 'name mobile email')
      .sort('-date -startMin')
      .skip(skip)
      .limit(limit)
  ]);

  // Backward compatibility: If no page or paginate query is sent, return raw array
  if (!req.query.page && !req.query.limit && !req.query.paginate) {
    return res.json(appointments);
  }

  res.json({
    appointments,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit)
  });
}));

r.post('/appointments', wrap(async (req, res) => {
  need(req.body, ['customerId', 'date', 'startMin']);
  let svcIds = [];
  if (Array.isArray(req.body.serviceIds) && req.body.serviceIds.length) {
    svcIds = req.body.serviceIds;
  } else if (typeof req.body.serviceIds === 'string' && req.body.serviceIds.trim()) {
    svcIds = req.body.serviceIds.split(',').map((id) => id.trim()).filter(Boolean);
  } else if (req.body.serviceId) {
    svcIds = [req.body.serviceId];
  } else {
    return res.status(400).json({ message: 'Select at least one service' });
  }

  const [svcs, cust] = await Promise.all([
    Service.find({ _id: { $in: svcIds }, shopId: req.shopId }),
    Customer.findOne({ _id: req.body.customerId, shopId: req.shopId })
  ]);
  if (!svcs.length || !cust) return res.status(404).json({ message: 'Service or customer not found in your shop' });

  const totalDuration = svcs.reduce((sum, s) => sum + (s.duration || 30), 0);
  const totalPrice = svcs.reduce((sum, s) => sum + (s.price || 0), 0);
  const serviceNames = svcs.map((s) => s.name).join(' + ');

  const start = Number(req.body.startMin);
  const end = start + totalDuration;
  const booked = await Appointment.find({ shopId: req.shopId, date: req.body.date, blocking: true });
  if (hasConflict(booked, start, end)) return res.status(409).json({ message: 'Time slot already booked' });

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
    status: 'confirmed',
    staffName: req.body.staffName
  });
  res.status(201).json({ data: a, message: `Appointment scheduled for ${cust.name} (${totalDuration}m, ₹${totalPrice})` });
}));
r.patch('/appointments/:id', wrap(async (req, res) => {
  const ok = ['confirmed', 'in_progress', 'cancelled', 'rejected', 'no_show', 'completed'];
  if (!ok.includes(req.body.status)) return res.status(400).json({ message: 'Invalid status' });
  const a = await Appointment.findOne({ _id: req.params.id, shopId: req.shopId }).populate('customerId');
  if (!a) return res.status(404).json({ message: 'Not found' });
  a.status = req.body.status; await a.save();
  if (a.customerId && a.customerId.userId) {
    const sH = Math.floor(a.startMin / 60);
    const sM = a.startMin % 60;
    const timeFormatted = `${String(sH).padStart(2, '0')}:${String(sM).padStart(2, '0')}`;
    let notifTitle = `Booking ${a.status.replace('_', ' ').toUpperCase()}`;
    if (a.status === 'confirmed') notifTitle = '🎉 Booking Confirmed!';
    else if (a.status === 'in_progress') notifTitle = '✂️ Service In Progress';
    else if (a.status === 'completed') notifTitle = '✅ Service Completed!';
    else if (['cancelled', 'rejected'].includes(a.status)) notifTitle = '⚠️ Appointment Cancelled';

    emitUser(a.customerId.userId, 'booking:updated', {
      id: a._id.toString(),
      appointmentId: a._id.toString(),
      status: a.status,
      title: notifTitle,
      serviceName: a.serviceName,
      date: a.date,
      startMin: a.startMin,
      time: timeFormatted,
      price: a.price,
      message: `Your appointment for ${a.serviceName} on ${a.date} at ${timeFormatted} is now ${a.status.replace('_', ' ')}.`,
      type: a.status,
      timestamp: new Date().toISOString()
    });
  }
  if (a.status === 'confirmed') sendWhatsApp(a.customerId.mobile, `Your booking at ${req.shop.name} on ${a.date} is confirmed.`);
  res.json({ data: a, message: 'Status: ' + a.status });
}));
r.post('/invoices', wrap(async (req, res) => {
  need(req.body, ['appointmentId']);
  const a = await Appointment.findOne({ _id: req.body.appointmentId, shopId: req.shopId });
  if (!a) return res.status(404).json({ message: 'Not found' });
  const discount = Number(req.body.discount || 0), taxPct = Number(req.body.taxPct || 0);
  const total = Math.max(0, (a.price - discount) * (1 + taxPct / 100));
  const items = (a.services && a.services.length)
    ? a.services.map((s) => ({ name: s.name, price: s.price }))
    : [{ name: a.serviceName, price: a.price }];
  const inv = await Invoice.create({ shopId: req.shopId, appointmentId: a._id, customerId: a.customerId, items, discount, taxPct, total, method: req.body.method || 'cash' });
  a.status = 'completed'; await a.save();
  await Customer.updateOne({ _id: a.customerId, shopId: req.shopId }, { $inc: { loyaltyPoints: Math.floor(total / 100) } });
  res.status(201).json({ data: inv, message: 'Bill generated: ₹' + total });
}));
r.get('/invoices', wrap(async (req, res) => res.json(await Invoice.find({ shopId: req.shopId }).populate('customerId', 'name').sort('-createdAt').limit(200))));

r.get('/notifications', wrap(async (req, res) => {
  const recent = await Appointment.find({ shopId: req.shopId })
    .populate('customerId', 'name mobile')
    .sort('-createdAt')
    .limit(25);

  const notifs = recent.map((a) => {
    const startH = Math.floor(a.startMin / 60);
    const startM = a.startMin % 60;
    const timeStr = `${String(startH).padStart(2, '0')}:${String(startM).padStart(2, '0')}`;
    const custName = a.customerId?.name || 'Walk-In';

    let title = 'New Online Booking';
    let type = 'booking';
    if (a.status === 'cancelled' || a.status === 'rejected') {
      title = 'Appointment Cancelled';
      type = 'cancellation';
    } else if (a.status === 'completed') {
      title = 'Service Completed';
      type = 'completed';
    }

    return {
      id: a._id.toString(),
      title,
      customer: custName,
      serviceName: a.serviceName,
      price: a.price,
      date: a.date,
      time: timeStr,
      startMin: a.startMin,
      status: a.status,
      type,
      message: `${custName} • ${a.serviceName} on ${a.date} at ${timeStr} (₹${a.price})`,
      timestamp: a.createdAt || new Date().toISOString()
    };
  });

  res.json(notifs);
}));

module.exports = r;
