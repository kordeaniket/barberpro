const mongoose = require('mongoose');
const { Schema } = mongoose;
const T = { timestamps: true };
const ref = (m) => ({ type: Schema.Types.ObjectId, ref: m });
const User = mongoose.model('User', new Schema({
  name: String, mobile: { type: String, required: true, unique: true }, email: String,
  passwordHash: { type: String, required: true },
  role: { type: String, enum: ['superadmin', 'barber', 'customer'], required: true },
  shopId: { ...ref('Shop'), index: true }, mustChangePassword: { type: Boolean, default: false },
  refreshHash: String, active: { type: Boolean, default: true }, avatarUrl: String,
}, T));
const Plan = mongoose.model('Plan', new Schema({
  name: { type: String, required: true, unique: true }, price: { type: Number, default: 0 },
  cycle: { type: String, enum: ['trial', 'monthly', 'yearly'], default: 'monthly' },
  maxBarbers: Number, maxCustomers: Number, monthlyBookings: Number, waLimit: Number, features: [String],
}, T));
const Shop = mongoose.model('Shop', new Schema({
  name: { type: String, required: true }, ownerName: { type: String, required: true },
  mobile: { type: String, required: true, unique: true }, email: String, address: String, city: String,
  openMin: { type: Number, default: 600 }, closeMin: { type: Number, default: 1260 },
  holidays: [Number], planId: ref('Plan'), subscriptionEnds: Date,
  status: { type: String, enum: ['active', 'inactive', 'suspended'], default: 'active' },
  shopCode: { type: String, unique: true },
  logoUrl: String, bannerUrl: String, description: String,
  upiId: String, gpayNumber: String, phonePeNumber: String,
  upiQrUrl: String, acceptOnlinePayment: { type: Boolean, default: false },
}, T));
const Service = mongoose.model('Service', new Schema({
  shopId: { ...ref('Shop'), required: true, index: true }, name: { type: String, required: true },
  description: String, price: { type: Number, required: true, min: 0 },
  duration: { type: Number, required: true, min: 5 }, active: { type: Boolean, default: true },
}, T));
const customerSchema = new Schema({
  shopId: { ...ref('Shop'), required: true }, userId: ref('User'), name: { type: String, required: true },
  mobile: { type: String, required: true }, email: String, dob: Date, gender: String, notes: String,
  loyaltyPoints: { type: Number, default: 0 }, deleted: { type: Boolean, default: false },
}, T);
customerSchema.index({ shopId: 1, mobile: 1 }, { unique: true });
const Customer = mongoose.model('Customer', customerSchema);
const BLOCKING = ['pending', 'confirmed', 'in_progress'];
const apptSchema = new Schema({
  shopId: { ...ref('Shop'), required: true }, customerId: { ...ref('Customer'), required: true },
  serviceId: ref('Service'), serviceName: String, price: Number, staffName: String,
  services: [{ serviceId: ref('Service'), name: String, price: Number, duration: Number }],
  duration: Number,
  date: { type: String, required: true }, startMin: { type: Number, required: true }, endMin: { type: Number, required: true },
  status: { type: String, enum: ['pending', 'confirmed', 'in_progress', 'completed', 'cancelled', 'rejected', 'no_show'], default: 'pending' },
  blocking: { type: Boolean, default: true }, source: { type: String, default: 'barber' },
  reminded1h: { type: Boolean, default: false }, remindedAt: Date,
}, T);
apptSchema.pre('save', function (next) { this.blocking = BLOCKING.includes(this.status); next(); });
apptSchema.index({ shopId: 1, date: 1, startMin: 1 }, { unique: true, partialFilterExpression: { blocking: true } });
const Appointment = mongoose.model('Appointment', apptSchema);
const Invoice = mongoose.model('Invoice', new Schema({
  shopId: { ...ref('Shop'), required: true, index: true }, appointmentId: ref('Appointment'), customerId: ref('Customer'),
  items: [{ name: String, price: Number }], discount: { type: Number, default: 0 }, taxPct: { type: Number, default: 0 },
  total: Number, method: { type: String, enum: ['cash', 'upi', 'card', 'online'], default: 'cash' }, status: { type: String, default: 'paid' },
}, T));
const shopRequestSchema = new Schema({
  shopName: { type: String, required: true },
  ownerName: { type: String, required: true },
  mobile: { type: String, required: true },
  email: String,
  city: String,
  address: String,
  passwordHash: { type: String, required: true },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  rejectionReason: String,
  shopId: ref('Shop'),
  processedAt: Date,
}, T);
shopRequestSchema.index({ mobile: 1, status: 1 });
const ShopRequest = mongoose.model('ShopRequest', shopRequestSchema);
module.exports = { User, Plan, Shop, Service, Customer, Appointment, Invoice, BLOCKING, ShopRequest };
