const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
require('dotenv').config();
const mongoose = require('mongoose'); const bcrypt = require('bcryptjs');
const { User, Plan, Shop, Service, Customer } = require('./models');
(async () => {
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/barberpro');
  const mobile = process.env.SUPER_ADMIN_MOBILE || '8806689125';
  const superPassword = process.env.SUPER_ADMIN_PASSWORD || 'password';
  const adminHash = await bcrypt.hash(superPassword, 10);
  const existingAdmin = await User.findOne({ mobile });
  if (!existingAdmin) {
    await User.create({ name: 'Platform Owner', mobile, role: 'superadmin', passwordHash: adminHash, mustChangePassword: true, active: true });
  } else {
    existingAdmin.passwordHash = adminHash;
    existingAdmin.active = true;
    await existingAdmin.save();
  }
  const plans = [{ name: 'Free Trial', cycle: 'trial', price: 0, maxBarbers: 2, maxCustomers: 100 }, { name: 'Basic', price: 499, cycle: 'monthly', maxBarbers: 3, maxCustomers: 500 }, { name: 'Standard', price: 999, cycle: 'monthly', maxBarbers: 8, maxCustomers: 2000 }, { name: 'Premium', price: 1999, cycle: 'monthly', maxBarbers: 25, maxCustomers: 10000 }];
  for (const p of plans) await Plan.updateOne({ name: p.name }, p, { upsert: true });
  if (!(await Shop.findOne({ shopCode: 'DEMO01' }))) {
    const shop = await Shop.create({ name: 'Demo Barber Shop', ownerName: 'Demo Owner', mobile: '9999999991', city: 'Pune', shopCode: 'DEMO01', planId: (await Plan.findOne({ name: 'Basic' }))._id });
    await User.create({ name: 'Demo Owner', mobile: '9999999991', role: 'barber', shopId: shop._id, passwordHash: await bcrypt.hash('barber123', 10) });
    await Service.insertMany([{ name: 'Haircut', price: 200, duration: 30 }, { name: 'Beard Trim', price: 100, duration: 15 }, { name: 'Hair Spa', price: 600, duration: 60 }].map((s) => ({ ...s, shopId: shop._id })));
    await Customer.create({ shopId: shop._id, name: 'Sample Customer', mobile: '9000000001' });
  }
  console.log('Seeded. Super admin:', mobile, '(password from .env, must change on first login). Demo barber: 9999999991 / barber123. Demo shop code: DEMO01');
  process.exit(0);
})();
