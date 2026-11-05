const { Appointment, Customer, Shop } = require('../models');
const { sendWhatsApp } = require('./whatsapp');

function fmtTime(m) {
  if (m === undefined || m === null) return '--:--';
  const h = Math.floor(m / 60);
  const min = m % 60;
  const ampm = h >= 12 ? 'PM' : 'AM';
  const displayH = h % 12 || 12;
  return `${displayH}:${String(min).padStart(2, '0')} ${ampm}`;
}

/**
 * Checks all upcoming appointments and sends automated 1-hour WhatsApp reminders
 * to both the Client and the Barber's registered mobile number.
 */
async function process1HourReminders() {
  try {
    // Current IST date and time (UTC + 5:30)
    const nowUtc = Date.now();
    const istOffsetMs = 5.5 * 60 * 60 * 1000;
    const istNow = new Date(nowUtc + istOffsetMs);
    const todayStr = istNow.toISOString().slice(0, 10);
    const currentMin = istNow.getUTCHours() * 60 + istNow.getUTCMinutes();

    // Look for appointments scheduled within 45 to 75 mins from now
    const upcoming = await Appointment.find({
      date: todayStr,
      status: { $in: ['confirmed', 'in_progress', 'pending'] },
      reminded1h: { $ne: true },
      startMin: { $gte: currentMin + 45, $lte: currentMin + 75 }
    })
      .populate('customerId')
      .populate('shopId');

    const dispatched = [];

    for (const a of upcoming) {
      if (!a.customerId || !a.customerId.mobile) continue;
      const shopName = a.shopId?.name || 'our salon';
      const timeStr = fmtTime(a.startMin);
      const custName = a.customerId.name || 'Valued Client';
      const svcName = a.serviceName || 'haircut';
      const shopAddress = a.shopId?.address ? `${a.shopId.address}, ${a.shopId.city || ''}` : '';

      // 1. Client 1-Hour WhatsApp reminder message
      const clientMessage =
        `⏰ *Appointment Reminder* ⏰\n\n` +
        `Hi *${custName}*, your appointment for *${svcName}* at *${shopName}* is in *1 hour* at *${timeStr}*.\n\n` +
        (shopAddress ? `📍 Location: ${shopAddress}\n` : '') +
        `💰 Total Amount: ₹${a.price || 0}\n\n` +
        `Please arrive 5 minutes before your time. See you soon! ✂️`;

      await sendWhatsApp(a.customerId.mobile, clientMessage);

      // 2. Alert to Barber's registered mobile number
      const barberPhone = a.shopId?.mobile;
      if (barberPhone) {
        const barberMessage =
          `🔔 *Upcoming Client in 1 Hour* 🔔\n\n` +
          `Client: *${custName}* (${a.customerId.mobile})\n` +
          `Service: *${svcName}*\n` +
          `Time: *${timeStr}* (in ~1 hour)\n\n` +
          `Please prepare your station at ${shopName}.`;

        await sendWhatsApp(barberPhone, barberMessage);
      }

      a.reminded1h = true;
      a.remindedAt = new Date();
      await a.save();

      dispatched.push({
        id: a._id,
        customer: custName,
        mobile: a.customerId.mobile,
        barberMobile: barberPhone,
        time: timeStr
      });
    }

    return dispatched;
  } catch (err) {
    console.error('[reminders:1h:error]', err);
    return [];
  }
}

/**
 * Sends an immediate 1-hour / custom reminder for a specific appointment
 */
async function sendDirectAppointmentReminder(appointmentId, shopId, customMessage) {
  const a = await Appointment.findOne({ _id: appointmentId, shopId })
    .populate('customerId')
    .populate('shopId');

  if (!a || !a.customerId) {
    throw new Error('Appointment or client not found');
  }

  const shopName = a.shopId?.name || 'our salon';
  const timeStr = fmtTime(a.startMin);
  const custName = a.customerId.name || 'Valued Client';
  const svcName = a.serviceName || 'haircut';
  const shopAddress = a.shopId?.address ? `${a.shopId.address}, ${a.shopId.city || ''}` : '';

  const clientMsg =
    customMessage ||
    `⏰ *Appointment Reminder* ⏰\n\n` +
    `Hi *${custName}*, your appointment for *${svcName}* at *${shopName}* is scheduled for *${timeStr}* (${a.date}).\n\n` +
    (shopAddress ? `📍 Location: ${shopAddress}\n` : '') +
    `💰 Total: ₹${a.price || 0}\n\n` +
    `Please arrive 5 minutes before your time. See you soon! ✂️`;

  // Send to client
  const clientRes = await sendWhatsApp(a.customerId.mobile, clientMsg);

  // Send notification to Barber registered mobile
  const barberPhone = a.shopId?.mobile;
  let barberRes = null;
  if (barberPhone) {
    const barberMsg =
      `🔔 *Client Reminder Alert* 🔔\n\n` +
      `Reminder sent to *${custName}* (${a.customerId.mobile}) for *${svcName}* on ${a.date} at *${timeStr}*.`;
    barberRes = await sendWhatsApp(barberPhone, barberMsg);
  }

  a.reminded1h = true;
  a.remindedAt = new Date();
  await a.save();

  return {
    success: true,
    client: { name: custName, mobile: a.customerId.mobile, sent: clientRes },
    barber: { mobile: barberPhone, sent: barberRes },
    message: clientMsg
  };
}

module.exports = {
  process1HourReminders,
  sendDirectAppointmentReminder,
  fmtTime
};

