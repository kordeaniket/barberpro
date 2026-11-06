const r = require('express').Router();
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const { User, Shop, Plan, Customer, Appointment, Invoice, Service, ShopRequest } = require('../models');
const { auth } = require('../middleware/auth');
const { wrap, pick, need, rand } = require('../utils/helpers');
const { sendWhatsApp } = require('../services/whatsapp');

r.use(auth('superadmin'));

// Helper to generate last 6 months list
function getLast6Months() {
  const result = [];
  const d = new Date();
  for (let i = 5; i >= 0; i--) {
    const target = new Date(d.getFullYear(), d.getMonth() - i, 1);
    const yyyy = target.getFullYear();
    const mm = String(target.getMonth() + 1).padStart(2, '0');
    const monthKey = `${yyyy}-${mm}`;
    const label = target.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
    result.push({ key: monthKey, label, sales: 0, count: 0 });
  }
  return result;
}

r.get('/dashboard', wrap(async (req, res) => {
  const { shopId } = req.query;
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  // Common list of all shops for the dropdown
  const allShops = await Shop.find().select('_id name shopCode city ownerName status').sort('name');

  // STORE SPECIFIC REPORT
  if (shopId && shopId !== 'all') {
    if (!mongoose.Types.ObjectId.isValid(shopId)) {
      return res.status(400).json({ message: 'Invalid store ID' });
    }
    const sId = new mongoose.Types.ObjectId(shopId);
    const shop = await Shop.findById(sId).populate('planId', 'name cycle price');
    if (!shop) return res.status(404).json({ message: 'Store not found' });

    const [
      barbers,
      customers,
      servicesCount,
      totalBookings,
      completed,
      cancelled,
      pending,
      confirmed,
      totalSalesAgg,
      todaySalesAgg,
      monthSalesAgg,
      rawMonthlyTrend,
      topServicesAgg,
      recentBookings
    ] = await Promise.all([
      User.countDocuments({ shopId: sId, role: 'barber' }),
      Customer.countDocuments({ shopId: sId, deleted: false }),
      Service.countDocuments({ shopId: sId, active: true }),
      Appointment.countDocuments({ shopId: sId }),
      Appointment.countDocuments({ shopId: sId, status: 'completed' }),
      Appointment.countDocuments({ shopId: sId, status: { $in: ['cancelled', 'rejected', 'no_show'] } }),
      Appointment.countDocuments({ shopId: sId, status: 'pending' }),
      Appointment.countDocuments({ shopId: sId, status: { $in: ['confirmed', 'in_progress'] } }),
      Invoice.aggregate([{ $match: { shopId: sId } }, { $group: { _id: null, t: { $sum: '$total' } } }]),
      Invoice.aggregate([{ $match: { shopId: sId, createdAt: { $gte: todayStart } } }, { $group: { _id: null, t: { $sum: '$total' } } }]),
      Invoice.aggregate([{ $match: { shopId: sId, createdAt: { $gte: monthStart } } }, { $group: { _id: null, t: { $sum: '$total' } } }]),
      Invoice.aggregate([
        { $match: { shopId: sId } },
        { $group: { _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } }, total: { $sum: '$total' }, count: { $sum: 1 } } }
      ]),
      Appointment.aggregate([
        { $match: { shopId: sId } },
        { $group: { _id: '$serviceName', count: { $sum: 1 }, revenue: { $sum: '$price' } } },
        { $sort: { count: -1 } },
        { $limit: 5 }
      ]),
      Appointment.find({ shopId: sId }).populate('customerId', 'name mobile').sort('-createdAt').limit(6)
    ]);

    // Align monthly trend for last 6 months
    const monthlyTrend = getLast6Months();
    rawMonthlyTrend.forEach((m) => {
      const match = monthlyTrend.find((x) => x.key === m._id);
      if (match) {
        match.sales = m.total || 0;
        match.count = m.count || 0;
      }
    });

    const totalSales = totalSalesAgg[0]?.t || 0;
    const todaySales = todaySalesAgg[0]?.t || 0;
    const monthSales = monthSalesAgg[0]?.t || 0;

    return res.json({
      mode: 'store',
      selectedShopId: shopId,
      shop: {
        id: shop._id,
        name: shop.name,
        ownerName: shop.ownerName,
        mobile: shop.mobile,
        email: shop.email,
        address: shop.address,
        city: shop.city,
        shopCode: shop.shopCode,
        status: shop.status,
        planName: shop.planId?.name || 'Standard',
        subscriptionEnds: shop.subscriptionEnds,
        openMin: shop.openMin,
        closeMin: shop.closeMin
      },
      stats: {
        totalSales,
        todaySales,
        monthSales,
        barbers,
        customers,
        servicesCount,
        totalBookings,
        completed,
        cancelled,
        pending,
        confirmed,
        completionRate: totalBookings > 0 ? Math.round((completed / totalBookings) * 100) : 0
      },
      monthlyTrend,
      topServices: topServicesAgg.map((s) => ({
        name: s._id || 'Standard Cut',
        count: s.count,
        revenue: s.revenue || 0
      })),
      recentBookings: recentBookings.map((b) => ({
        id: b._id,
        customer: b.customerId?.name || 'Walk-in',
        mobile: b.customerId?.mobile,
        service: b.serviceName,
        price: b.price,
        date: b.date,
        time: `${Math.floor(b.startMin / 60)}:${String(b.startMin % 60).padStart(2, '0')}`,
        status: b.status
      })),
      allShops
    });
  }

  // PLATFORM WIDE OVERVIEW
  const [
    shopsCount,
    activeShops,
    barbers,
    customers,
    totalBookings,
    completed,
    cancelled,
    pending,
    confirmed,
    totalSalesAgg,
    todaySalesAgg,
    monthSalesAgg,
    perShopAgg,
    rawMonthlyTrend,
    plans,
    pendingShopRequests
  ] = await Promise.all([
    Shop.countDocuments(),
    Shop.countDocuments({ status: 'active' }),
    User.countDocuments({ role: 'barber' }),
    Customer.countDocuments({ deleted: false }),
    Appointment.countDocuments(),
    Appointment.countDocuments({ status: 'completed' }),
    Appointment.countDocuments({ status: { $in: ['cancelled', 'rejected', 'no_show'] } }),
    Appointment.countDocuments({ status: 'pending' }),
    Appointment.countDocuments({ status: { $in: ['confirmed', 'in_progress'] } }),
    Invoice.aggregate([{ $group: { _id: null, t: { $sum: '$total' } } }]),
    Invoice.aggregate([{ $match: { createdAt: { $gte: todayStart } } }, { $group: { _id: null, t: { $sum: '$total' } } }]),
    Invoice.aggregate([{ $match: { createdAt: { $gte: monthStart } } }, { $group: { _id: null, t: { $sum: '$total' } } }]),
    Invoice.aggregate([
      { $group: { _id: '$shopId', sales: { $sum: '$total' }, count: { $sum: 1 } } },
      { $lookup: { from: 'shops', localField: '_id', foreignField: '_id', as: 's' } },
      { $project: { sales: 1, count: 1, name: { $arrayElemAt: ['$s.name', 0] }, code: { $arrayElemAt: ['$s.shopCode', 0] }, city: { $arrayElemAt: ['$s.city', 0] }, status: { $arrayElemAt: ['$s.status', 0] } } },
      { $sort: { sales: -1 } }
    ]),
    Invoice.aggregate([
      { $group: { _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } }, total: { $sum: '$total' }, count: { $sum: 1 } } }
    ]),
    Plan.find().select('name cycle price'),
    ShopRequest.countDocuments({ status: 'pending' })
  ]);

  const monthlyTrend = getLast6Months();
  rawMonthlyTrend.forEach((m) => {
    const match = monthlyTrend.find((x) => x.key === m._id);
    if (match) {
      match.sales = m.total || 0;
      match.count = m.count || 0;
    }
  });

  const totalSales = totalSalesAgg[0]?.t || 0;
  const todaySales = todaySalesAgg[0]?.t || 0;
  const monthSales = monthSalesAgg[0]?.t || 0;

  res.json({
    mode: 'platform',
    selectedShopId: 'all',
    stats: {
      shops: shopsCount,
      active: activeShops,
      inactive: shopsCount - activeShops,
      barbers,
      customers,
      bookings: totalBookings,
      completed,
      cancelled,
      pending,
      confirmed,
      totalSales,
      todaySales,
      monthSales,
      completionRate: totalBookings > 0 ? Math.round((completed / totalBookings) * 100) : 0,
      pendingShopRequests: pendingShopRequests || 0
    },
    perShop: perShopAgg,
    monthlyTrend,
    plans,
    allShops
  });
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
  await User.create({ name: shop.ownerName, mobile: shop.mobile, email: shop.email, role: 'barber', shopId: shop._id, passwordHash: await bcrypt.hash(temp, 10), mustChangePassword: false });
  const base = process.env.CLIENT_URL || 'http://localhost:5173';
  res.status(201).json({ shop, message: `Shop created. Login ${shop.mobile} / temp password ${temp} (shown once). Customer link: ${base}/s/${shop.shopCode}` });
}));
r.patch('/shops/:id', wrap(async (req, res) => res.json(await Shop.findByIdAndUpdate(req.params.id, pick(req.body, ['name', 'ownerName', 'email', 'address', 'city', 'status', 'planId', 'openMin', 'closeMin']), { new: true }))));
r.post('/shops/:id/reset-password', wrap(async (req, res) => {
  const temp = rand(4);
  await User.updateOne({ shopId: req.params.id, role: 'barber' }, { passwordHash: await bcrypt.hash(temp, 10), mustChangePassword: false });
  res.json({ message: 'New temporary password: ' + temp });
}));

// List Shop Registration Requests
r.get('/shop-requests', wrap(async (req, res) => {
  const { status } = req.query;
  const filter = {};
  if (status && status !== 'all') {
    filter.status = status;
  }
  const requests = await ShopRequest.find(filter)
    .populate('shopId', 'name shopCode')
    .sort('-createdAt');
  res.json(requests);
}));

// Approve Shop Registration Request
r.post('/shop-requests/:id/approve', wrap(async (req, res) => {
  const shopReq = await ShopRequest.findById(req.params.id);
  if (!shopReq) return res.status(404).json({ message: 'Registration request not found' });
  if (shopReq.status !== 'pending') {
    return res.status(400).json({ message: `Request is already ${shopReq.status}` });
  }

  // Check if mobile is already used by a user
  const existingUser = await User.findOne({ mobile: shopReq.mobile });
  if (existingUser) {
    return res.status(409).json({ message: `A user with mobile ${shopReq.mobile} already exists.` });
  }

  // Assign trial or specified plan
  const plan = req.body.planId ? await Plan.findById(req.body.planId) : await Plan.findOne({ cycle: 'trial' });
  const ends = new Date(Date.now() + (plan?.cycle === 'trial' ? 14 : 30) * 864e5);
  const shopCode = rand(3).toUpperCase();

  // Create Shop
  const shop = await Shop.create({
    name: shopReq.shopName,
    ownerName: shopReq.ownerName,
    mobile: shopReq.mobile,
    email: shopReq.email,
    city: shopReq.city,
    address: shopReq.address,
    planId: plan?._id,
    subscriptionEnds: ends,
    shopCode,
    status: 'active'
  });

  // Create Barber User
  const user = await User.create({
    name: shopReq.ownerName,
    mobile: shopReq.mobile,
    email: shopReq.email,
    role: 'barber',
    shopId: shop._id,
    passwordHash: shopReq.passwordHash,
    mustChangePassword: false,
    active: true
  });

  // Update request record
  shopReq.status = 'approved';
  shopReq.shopId = shop._id;
  shopReq.processedAt = new Date();
  await shopReq.save();

  // Determine URLs
  const base = process.env.CLIENT_URL || req.headers.origin || 'https://frontend-rho-orpin-73.vercel.app';
  const loginUrl = `${base}/login`;
  const bookingUrl = `${base}/s/${shopCode}`;

  // Send WhatsApp message to Barber
  const waMessage = `💈 *Welcome to BarberPro!* 💈\n\nDear *${shopReq.ownerName}*,\nYour shop registration for *${shopReq.shopName}* has been *APPROVED* by the Super Admin! 🎉\n\n*Your Login Credentials & Details:*\n📱 Registered Mobile: *${shopReq.mobile}*\n🔑 Password: (Use the password you entered during registration)\n🌐 Barber Login URL: ${loginUrl}\n\n*How to Log In & Get Started:*\n1️⃣ Open the login page: ${loginUrl}\n2️⃣ Enter your registered mobile number: *${shopReq.mobile}*\n3️⃣ Enter your password and click *Sign In*\n4️⃣ Go to *Settings* to configure your services, staff, and shop timings.\n\n*Your Customer Booking Link:*\n🔗 ${bookingUrl}\nShare this link with your customers to receive direct online bookings!\n\nWelcome to BarberPro! ✂️`;

  let waResult = { skipped: true };
  try {
    waResult = await sendWhatsApp(shopReq.mobile, waMessage);
  } catch (waErr) {
    console.error('Failed to send WhatsApp approval message:', waErr);
  }

  res.json({
    message: `Shop "${shop.name}" approved successfully! WhatsApp notification sent to ${shopReq.mobile}.`,
    shop,
    user: { id: user._id, mobile: user.mobile, name: user.name },
    waResult
  });
}));

// Reject Shop Registration Request
r.post('/shop-requests/:id/reject', wrap(async (req, res) => {
  const shopReq = await ShopRequest.findById(req.params.id);
  if (!shopReq) return res.status(404).json({ message: 'Registration request not found' });
  if (shopReq.status !== 'pending') {
    return res.status(400).json({ message: `Request is already ${shopReq.status}` });
  }

  const reason = req.body.reason ? String(req.body.reason).trim() : 'Registration details could not be verified at this time.';

  shopReq.status = 'rejected';
  shopReq.rejectionReason = reason;
  shopReq.processedAt = new Date();
  await shopReq.save();

  // Send WhatsApp rejection message
  const waMessage = `✂️ *BarberPro Notification*\n\nDear *${shopReq.ownerName}*,\n\nThank you for your interest in registering *${shopReq.shopName}* on BarberPro.\n\nWe regret to inform you that your shop registration request could not be approved at this time.\n\n*Reason:* ${reason}\n\nIf you believe this is a mistake or wish to provide updated details, please reach out to our support team.\n\nBest regards,\n*BarberPro Admin Team*`;

  let waResult = { skipped: true };
  try {
    waResult = await sendWhatsApp(shopReq.mobile, waMessage);
  } catch (waErr) {
    console.error('Failed to send WhatsApp rejection message:', waErr);
  }

  res.json({
    message: `Shop request rejected. WhatsApp notification sent to ${shopReq.mobile}.`,
    shopRequest: shopReq,
    waResult
  });
}));

module.exports = r;
