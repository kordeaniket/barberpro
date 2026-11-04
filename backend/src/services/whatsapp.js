// WhatsApp Cloud API (backend only). Skips gracefully when not configured.
async function sendWhatsApp(to, text) {
  const { WA_TOKEN, WA_PHONE_ID } = process.env;
  if (!WA_TOKEN || !WA_PHONE_ID) { console.log('[whatsapp:not-configured]', to, text); return { skipped: true }; }
  try {
    const r = await fetch(`https://graph.facebook.com/v20.0/${WA_PHONE_ID}/messages`, {
      method: 'POST', headers: { Authorization: `Bearer ${WA_TOKEN}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ messaging_product: 'whatsapp', to: '91' + to, type: 'text', text: { body: text } }),
    });
    return { ok: r.ok };
  } catch (e) { return { ok: false, error: e.message }; }
}
module.exports = { sendWhatsApp };
