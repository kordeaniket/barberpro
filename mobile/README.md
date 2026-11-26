# BarberPro Mobile App (React Native + Expo)

Full-featured multi-role mobile application for **Customer**, **Barber (Shop Owner)**, and **Super Admin**, supporting **English** and **Marathi (मराठी)** languages.

## Features
- **Single Unified Login** (`GET /auth/lookup/:mobile`): Auto-detects Customer, Barber, or Super Admin from mobile number, plus Customer Registration & Barber Shop Registration Request.
- **Custom Animated Splash Screen** + App Icons & Bottom Tab Navigation for all roles.
- **Bilingual Support (English & Marathi)**: Switch language anytime from Settings/Profile or the Login screen; persisted in `AsyncStorage`.
- **Barber Role**: Dashboard with period filters (Daily/Weekly/Monthly/Yearly), Appointment management & walk-in booking, Client directory & ledger, Services & Billing/Invoicing, Store & Profile Management (Image upload from device, UPI ID / GPay / PhonePe / QR Code setup).
- **Customer Role**: Home & upcoming appointment view, Multi-service slot booking, Online UPI Payment modal (GPay/PhonePe/UPI deep links, QR scan, copy number), Booking history, Profile & Settings.
- **Super Admin Role**: Platform & Store-specific Analytics Dashboard, Shops management (create/edit/reset password), Shop Registration Approvals/Rejections, Subscription Plans, Settings.

## Setup & Run

```bash
cd mobile
npm install
npx expo start
```

### Environment Configuration
Edit `mobile/.env` to point to your backend:
```env
EXPO_PUBLIC_API_URL=https://backend-drab-beta.vercel.app
EXPO_PUBLIC_SOCKET_URL=https://backend-drab-beta.vercel.app
```
> Note: For local Express backend on Android Emulator, use `http://10.0.2.2:5000`. For a physical phone on the same Wi-Fi, use `http://<YOUR_PC_LOCAL_IP>:5000`.
