const r = require('express').Router();
const { Shop, User, Customer, Service, Appointment, Invoice } = require('../models');
const { auth } = require('../middleware/auth');
const { wrap, pick, need, today } = require('../utils/helpers');
const { hasConflict, genSlots } = require('../utils/slots');
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
r.get('/shop', wrap(async (req, res) => {
  const baseClientUrl = process.env.CLIENT_URL || (process.env.NODE_ENV === 'production' ? 'https://frontend-rho-orpin-73.vercel.app' : 'http://localhost:5173');
  res.json({ shop: req.shop, customerLink: `${baseClientUrl}/s/${req.shop.shopCode}` });
}));
r.get('/dashboard', wrap(async (req, res) => {
  const shopId = req.shopId;
  const d = today(); // "YYYY-MM-DD"
  const now = new Date();
  const period = req.query.period || 'daily';

  // ── Date range for the selected period ──────────────────────────
  let periodStart, periodEnd;
  if (period === 'weekly') {
    periodStart = new Date(now); periodStart.setDate(now.getDate() - 6); periodStart.setHours(0, 0, 0, 0);
    periodEnd = new Date(now); periodEnd.setHours(23, 59, 59, 999);
  } else if (period === 'monthly') {
    periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
    periodEnd = new Date(now); periodEnd.setHours(23, 59, 59, 999);
  } else if (period === 'yearly') {
    periodStart = new Date(now.getFullYear(), 0, 1);
    periodEnd = new Date(now); periodEnd.setHours(23, 59, 59, 999);
  } else {
    // daily
    periodStart = new Date(d); periodStart.setHours(0, 0, 0, 0);
    periodEnd = new Date(d); periodEnd.setHours(23, 59, 59, 999);
  }

  // Helper: generate YYYY-MM-DD strings in a date range (inclusive)
  const datesToStrings = (from, to) => {
    const result = [];
    const cur = new Date(from);
    while (cur <= to) {
      result.push(cur.toISOString().slice(0, 10));
      cur.setDate(cur.getDate() + 1);
    }
    return result;
  };
  const periodDateStrings = datesToStrings(periodStart, periodEnd);

  // ── Appointment filter (string date field) ─────────────────────
  const apptPeriodFilter = { shopId, date: { $in: periodDateStrings } };
  const apptTodayFilter = { shopId, date: d };

  // ── Invoice / Customer filter (Date createdAt) ─────────────────
  const invoicePeriodFilter = { shopId, createdAt: { $gte: periodStart, $lte: periodEnd } };
  const invoiceTodayFilter = { shopId, createdAt: { $gte: new Date(d), $lte: new Date(d + 'T23:59:59.999Z') } };
  const customerPeriodFilter = { shopId, deleted: false, createdAt: { $gte: periodStart, $lte: periodEnd } };

  // ── 1. Summary cards ──────────────────────────────────────────
  const [
    totalAppointments,
    completedAppointments,
    pendingAppointments,
    cancelledAppointments,
    revenueAgg,
    totalCustomers,
    newCustomers,
    totalServices,
    onlineBookings,
    walkInBookings,
    todayTotal,
    todayCompleted,
    todayPending,
    todayCancelled,
    todayRevenueAgg
  ] = await Promise.all([
    Appointment.countDocuments(apptPeriodFilter),
    Appointment.countDocuments({ ...apptPeriodFilter, status: 'completed' }),
    Appointment.countDocuments({ shopId, status: 'pending' }),
    Appointment.countDocuments({ ...apptPeriodFilter, status: { $in: ['cancelled', 'rejected'] } }),
    Invoice.aggregate([{ $match: invoicePeriodFilter }, { $group: { _id: null, t: { $sum: '$total' }, c: { $sum: 1 } } }]),
    Customer.countDocuments({ shopId, deleted: false }),
    Customer.countDocuments(customerPeriodFilter),
    Service.countDocuments({ shopId, active: { $ne: false } }),
    Appointment.countDocuments({ ...apptPeriodFilter, source: 'online' }),
    Appointment.countDocuments({ ...apptPeriodFilter, source: 'barber' }),
    // today snapshot
    Appointment.countDocuments(apptTodayFilter),
    Appointment.countDocuments({ ...apptTodayFilter, status: 'completed' }),
    Appointment.countDocuments({ ...apptTodayFilter, status: 'pending' }),
    Appointment.countDocuments({ ...apptTodayFilter, status: { $in: ['cancelled', 'rejected'] } }),
    Invoice.aggregate([{ $match: invoiceTodayFilter }, { $group: { _id: null, t: { $sum: '$total' } } }])
  ]);

  const totalRevenue = revenueAgg[0]?.t || 0;
  const invoiceCount = revenueAgg[0]?.c || 0;
  const avgTicketSize = invoiceCount > 0 ? Math.round(totalRevenue / invoiceCount) : 0;
  const todayRevenue = todayRevenueAgg[0]?.t || 0;

  // Repeat customer rate: customers with more than 1 completed appointment
  const repeatAgg = await Appointment.aggregate([
    { $match: { shopId, status: 'completed' } },
    { $group: { _id: '$customerId', cnt: { $sum: 1 } } },
    { $group: { _id: null, total: { $sum: 1 }, repeats: { $sum: { $cond: [{ $gt: ['$cnt', 1] }, 1, 0] } } } }
  ]);
  const repeatData = repeatAgg[0] || { total: 0, repeats: 0 };
  const repeatCustomerRate = repeatData.total > 0 ? Math.round((repeatData.repeats / repeatData.total) * 100) : 0;

  // ── Chart time buckets ────────────────────────────────────────
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  let buckets = []; // { label, startDate, endDate, dateStrings[] }

  if (period === 'daily') {
    // Last 7 days
    for (let i = 6; i >= 0; i--) {
      const dt = new Date(now); dt.setDate(now.getDate() - i); dt.setHours(0, 0, 0, 0);
      const dtEnd = new Date(dt); dtEnd.setHours(23, 59, 59, 999);
      const ds = dt.toISOString().slice(0, 10);
      buckets.push({ label: dayNames[dt.getDay()], start: dt, end: dtEnd, dateStrings: [ds] });
    }
  } else if (period === 'weekly') {
    // Last 4 weeks
    for (let i = 3; i >= 0; i--) {
      const wEnd = new Date(now); wEnd.setDate(now.getDate() - i * 7); wEnd.setHours(23, 59, 59, 999);
      const wStart = new Date(wEnd); wStart.setDate(wEnd.getDate() - 6); wStart.setHours(0, 0, 0, 0);
      buckets.push({ label: `Week ${4 - i}`, start: wStart, end: wEnd, dateStrings: datesToStrings(wStart, wEnd) });
    }
  } else if (period === 'monthly') {
    // Last 12 months
    for (let i = 11; i >= 0; i--) {
      const mStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const mEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59, 999);
      buckets.push({ label: monthNames[mStart.getMonth()], start: mStart, end: mEnd, dateStrings: datesToStrings(mStart, mEnd) });
    }
  } else {
    // yearly — last 5 years
    for (let i = 4; i >= 0; i--) {
      const yr = now.getFullYear() - i;
      const yStart = new Date(yr, 0, 1);
      const yEnd = new Date(yr, 11, 31, 23, 59, 59, 999);
      buckets.push({ label: String(yr), start: yStart, end: yEnd, dateStrings: datesToStrings(yStart, yEnd) });
    }
  }

  // Build chart data in parallel per bucket
  const [revenueChart, appointmentChart, customerGrowth] = await Promise.all([
    // Revenue chart
    Promise.all(buckets.map(async (b) => {
      const agg = await Invoice.aggregate([
        { $match: { shopId, createdAt: { $gte: b.start, $lte: b.end } } },
        { $group: { _id: null, revenue: { $sum: '$total' } } }
      ]);
      return { label: b.label, revenue: agg[0]?.revenue || 0 };
    })),
    // Appointment chart
    Promise.all(buckets.map(async (b) => {
      const [completed, cancelled, pending] = await Promise.all([
        Appointment.countDocuments({ shopId, date: { $in: b.dateStrings }, status: 'completed' }),
        Appointment.countDocuments({ shopId, date: { $in: b.dateStrings }, status: { $in: ['cancelled', 'rejected'] } }),
        Appointment.countDocuments({ shopId, date: { $in: b.dateStrings }, status: 'pending' })
      ]);
      return { label: b.label, completed, cancelled, pending };
    })),
    // Customer growth chart
    Promise.all(buckets.map(async (b) => {
      const count = await Customer.countDocuments({ shopId, deleted: false, createdAt: { $gte: b.start, $lte: b.end } });
      return { label: b.label, count };
    }))
  ]);

  // ── 4. Payment method breakdown ───────────────────────────────
  const paymentMethodBreakdown = await Invoice.aggregate([
    { $match: invoicePeriodFilter },
    { $group: { _id: '$method', count: { $sum: 1 }, total: { $sum: '$total' } } },
    { $project: { _id: 0, method: '$_id', count: 1, total: 1 } },
    { $sort: { total: -1 } }
  ]);

  // ── 5. Top 5 services ────────────────────────────────────────
  const topServices = await Appointment.aggregate([
    { $match: { shopId, date: { $in: periodDateStrings }, status: 'completed' } },
    { $unwind: { path: '$services', preserveNullAndEmptyArrays: true } },
    {
      $group: {
        _id: { $ifNull: ['$services.name', '$serviceName'] },
        count: { $sum: 1 },
        revenue: { $sum: { $ifNull: ['$services.price', '$price'] } }
      }
    },
    { $sort: { count: -1 } },
    { $limit: 5 },
    { $project: { _id: 0, name: '$_id', count: 1, revenue: 1 } }
  ]);

  // ── 6. Recent appointments ───────────────────────────────────
  const recentAppointments = await Appointment.find({ shopId })
    .populate('customerId', 'name mobile')
    .sort('-createdAt')
    .limit(5)
    .lean();

  // ── Build response ────────────────────────────────────────────
  res.json({
    summary: {
      totalAppointments,
      completedAppointments,
      pendingAppointments,
      cancelledAppointments,
      totalRevenue,
      avgTicketSize,
      totalCustomers,
      newCustomers,
      totalServices,
      onlineBookings,
      walkInBookings,
      repeatCustomerRate
    },
    revenueChart,
    appointmentChart,
    paymentMethodBreakdown,
    topServices,
    recentAppointments,
    customerGrowth,
    todaySnapshot: {
      todayTotal,
      todayCompleted,
      todayPending,
      todayCancelled,
      todayRevenue
    }
  });
}));
r.get('/appointments', wrap(async (req, res) => {
  // Calendar mode or unpaginated full list
  if (req.query.calendar === 'true' || req.query.all === 'true') {
    const list = await Appointment.find({ shopId: req.shopId })
      .populate('customerId', 'name mobile email')
      .sort(req.query.sort || '-createdAt');
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
      .sort(req.query.sort || '-createdAt')
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
  need(req.body, ['date', 'startMin']);

  // Resolve existing or create new Customer
  let cust;
  if (req.body.customerId) {
    cust = await Customer.findOne({ _id: req.body.customerId, shopId: req.shopId });
  } else if (req.body.clientName && req.body.clientMobile) {
    const mobile = String(req.body.clientMobile).trim();
    const name = String(req.body.clientName).trim();
    cust = await Customer.findOne({ mobile, shopId: req.shopId });
    if (cust) {
      if (cust.deleted) cust.deleted = false;
      cust.name = name;
      if (req.body.clientEmail) cust.email = String(req.body.clientEmail).trim();
      await cust.save();
    } else {
      cust = await Customer.create({
        shopId: req.shopId,
        name,
        mobile,
        email: req.body.clientEmail ? String(req.body.clientEmail).trim() : undefined,
        notes: req.body.clientNotes ? String(req.body.clientNotes).trim() : undefined
      });
    }
  } else {
    return res.status(400).json({ message: 'Customer selection or Client Name & Mobile is required' });
  }

  if (!cust) return res.status(404).json({ message: 'Customer not found or could not be created' });

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

  const svcs = await Service.find({ _id: { $in: svcIds }, shopId: req.shopId });
  if (!svcs.length) return res.status(404).json({ message: 'Service not found in your shop' });

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
  res.status(201).json({ data: a, customer: cust, message: `Appointment scheduled for ${cust.name} (${totalDuration}m, ₹${totalPrice})` });
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

// ── Client Management ───────────────────────────────────────────────

r.get('/customers-paginated', wrap(async (req, res) => {
  const page  = Math.max(parseInt(req.query.page)  || 1, 1);
  const limit = Math.min(Math.max(parseInt(req.query.limit) || 20, 1), 100);
  const skip  = (page - 1) * limit;

  const filter = { shopId: req.shopId, deleted: false };

  if (req.query.search) {
    const regex = new RegExp(req.query.search, 'i');
    filter.$or = [{ name: regex }, { mobile: regex }, { email: regex }];
  }

  const [customers, total] = await Promise.all([
    Customer.find(filter).sort('-createdAt').skip(skip).limit(limit),
    Customer.countDocuments(filter)
  ]);

  res.json({ customers, total, page, limit, totalPages: Math.ceil(total / limit) });
}));

r.get('/customers/:id/ledger', wrap(async (req, res) => {
  const customer = await Customer.findOne({ _id: req.params.id, shopId: req.shopId, deleted: false })
    .select('name mobile email notes createdAt');
  if (!customer) return res.status(404).json({ message: 'Customer not found' });

  const [appointments, invoices] = await Promise.all([
    Appointment.find({ customerId: req.params.id, shopId: req.shopId })
      .populate('services.serviceId')
      .sort('-date'),
    Invoice.find({ customerId: req.params.id, shopId: req.shopId })
      .sort('-createdAt')
  ]);

  const completedAppts = appointments.filter(a => a.status === 'completed');
  const totalSpent     = invoices.reduce((sum, inv) => sum + (inv.total || 0), 0);
  const cancelledCount = appointments.filter(a => a.status === 'cancelled').length;
  const lastVisitDate  = completedAppts.length ? completedAppts[0].date : null;

  res.json({
    customer,
    stats: {
      totalVisits:      appointments.length,
      completedVisits:  completedAppts.length,
      totalSpent,
      cancelledCount,
      lastVisitDate,
      avgSpendPerVisit: completedAppts.length ? +(totalSpent / completedAppts.length).toFixed(2) : 0
    },
    appointments,
    invoices
  });
}));

r.get('/slots', wrap(async (req, res) => {
  const shop = req.shop;
  let duration = 30;
  if (req.query.duration && Number(req.query.duration) > 0) {
    duration = Number(req.query.duration);
  } else if (req.query.serviceIds) {
    const rawIds = Array.isArray(req.query.serviceIds)
      ? req.query.serviceIds
      : String(req.query.serviceIds).split(',').map((id) => id.trim()).filter(Boolean);
    const svcs = await Service.find({ _id: { $in: rawIds }, shopId: req.shopId });
    if (svcs.length > 0) {
      duration = svcs.reduce((acc, x) => acc + (x.duration || 30), 0);
    }
  }

  const date = req.query.date || today();
  if (shop.holidays && shop.holidays.includes(new Date(date).getDay())) {
    return res.json([]);
  }

  const booked = await Appointment.find({ shopId: req.shopId, date, blocking: true });
  const allSlots = genSlots({ openMin: shop.openMin, closeMin: shop.closeMin, duration, booked });

  const now = new Date();
  const todayStr = now.toISOString().slice(0, 10);
  const currentMin = now.getHours() * 60 + now.getMinutes();

  const remainingSlots = allSlots.filter((slot) => {
    if (!slot.available) return false;
    if (date === todayStr && slot.startMin <= currentMin) return false;
    return true;
  });

  res.json(remainingSlots);
}));

module.exports = r;
