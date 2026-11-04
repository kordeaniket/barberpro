const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
require('dotenv').config();
const http = require('http'); const mongoose = require('mongoose');
const app = require('./app'); const { initSockets } = require('./sockets');
const server = http.createServer(app); initSockets(server);
mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/barberpro').then(() => {
  const p = process.env.PORT || 5000; server.listen(p, () => console.log('API on http://localhost:' + p));
}).catch((e) => { console.error('MongoDB connection failed:', e.message); process.exit(1); });
