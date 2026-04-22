// NeuroScan Notification Service
// Consumes RabbitMQ events → writes to DB → pushes via SSE
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const amqplib = require('amqplib');
const { Pool } = require('pg');
const jwt = require('jsonwebtoken');
const Consul = require('consul');

const app = express();
app.set('trust proxy', 1);
const PORT = process.env.PORT || 3005;
const JWT_SECRET = process.env.JWT_SECRET || 'neuroscan_super_secret_jwt_key_2025';

app.use(helmet());
app.use(cors({ origin: '*', methods: ['GET', 'POST', 'DELETE', 'OPTIONS'] }));
app.use(express.json());
app.use(morgan('combined'));

// ─── DB ──────────────────────────────────────────────────────
let pool;
async function connectDB() {
  pool = new Pool({
    host: process.env.DB_HOST || 'localhost', port: parseInt(process.env.DB_PORT) || 5432,
    database: process.env.DB_NAME || 'neuroscan', user: process.env.DB_USER || 'neuroscan_user',
    password: process.env.DB_PASS || 'neuroscan_pass', max: 5,
  });
  let retries = 15;
  while (retries > 0) {
    try { const c = await pool.connect(); c.release(); console.log('[Notif] DB connected'); return; }
    catch (e) { retries--; await new Promise(r => setTimeout(r, 3000)); }
  }
}

// ─── SSE CLIENT REGISTRY ─────────────────────────────────────
const sseClients = new Map(); // userId -> [res, ...]

function addSSEClient(userId, res) {
  if (!sseClients.has(userId)) sseClients.set(userId, []);
  sseClients.get(userId).push(res);
}

function removeSSEClient(userId, res) {
  if (!sseClients.has(userId)) return;
  const clients = sseClients.get(userId).filter(r => r !== res);
  if (clients.length === 0) sseClients.delete(userId);
  else sseClients.set(userId, clients);
}

function pushToUser(userId, data) {
  const clients = sseClients.get(userId);
  if (!clients) return;
  const payload = `data: ${JSON.stringify(data)}\n\n`;
  clients.forEach(res => { try { res.write(payload); } catch (e) {} });
}

// ─── AUTH MIDDLEWARE ──────────────────────────────────────────
function authenticate(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (!authHeader?.startsWith('Bearer ')) return res.status(401).json({ error: 'No token' });
  try { req.user = jwt.verify(authHeader.split(' ')[1], JWT_SECRET); next(); }
  catch { res.status(401).json({ error: 'Invalid token' }); }
}

// ─── NOTIFICATION TITLE/MESSAGE TEMPLATES ────────────────────
const NOTIF_TEMPLATES = {
  connection_request_sent:     { title: 'New Connection Request',    message: 'A new connection request has been sent to you.' },
  connection_request_accepted: { title: 'Request Accepted',          message: 'Your connection request has been accepted.' },
  connection_request_rejected: { title: 'Request Declined',          message: 'Your connection request was declined.' },
  mri_uploaded:                { title: 'New MRI Uploaded',          message: 'A new MRI scan has been uploaded.' },
  mri_processing_started:      { title: 'MRI Processing',            message: 'Your MRI scan is now being processed.' },
  ai_analysis_complete:        { title: 'Analysis Complete',         message: 'AI analysis has been completed for your scan.' },
  diagnosis_ready:             { title: 'Diagnosis Available',       message: 'Your doctor has completed a diagnosis for your scan.' },
  report_available:            { title: 'Report Available',          message: 'A medical report is now available for you.' },
  doctor_assigned:             { title: 'Doctor Assigned',           message: 'A doctor has been assigned to your account.' },
  account_created_for_you:     { title: 'Account Created',           message: 'A NeuroScan account has been created for you by your doctor.' },
};

async function createNotification(userId, type, data = {}) {
  if (!pool) return;
  const tmpl = NOTIF_TEMPLATES[type] || { title: type, message: 'You have a new notification.' };
  try {
    const result = await pool.query(
      `INSERT INTO notifications (user_id, type, title, message, data) VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [userId, type, tmpl.title, tmpl.message, JSON.stringify(data)]
    );
    const notif = result.rows[0];
    pushToUser(userId, { event: 'notification', notification: notif });
    return notif;
  } catch (e) {
    console.error('[Notif] DB insert error:', e.message);
  }
}

// ─── REST ROUTES ──────────────────────────────────────────────

// SSE stream endpoint
app.get('/api/notifications/stream', authenticate, (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders();

  const userId = req.user.id;
  addSSEClient(userId, res);

  // Send heartbeat every 25s to keep connection alive
  const heartbeat = setInterval(() => {
    try { res.write(': heartbeat\n\n'); } catch (e) {}
  }, 25000);

  res.on('close', () => {
    clearInterval(heartbeat);
    removeSSEClient(userId, res);
  });
});

// Get all notifications for current user
app.get('/api/notifications', authenticate, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT 50`,
      [req.user.id]
    );
    const unread = result.rows.filter(n => !n.is_read).length;
    res.json({ notifications: result.rows, unreadCount: unread });
  } catch (e) {
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

// Mark one as read
app.put('/api/notifications/:id/read', authenticate, async (req, res) => {
  try {
    await pool.query(
      `UPDATE notifications SET is_read = TRUE WHERE id = $1 AND user_id = $2`,
      [req.params.id, req.user.id]
    );
    res.json({ message: 'Marked as read' });
  } catch (e) {
    res.status(500).json({ error: 'Failed to update' });
  }
});

// Mark all as read
app.put('/api/notifications/read-all', authenticate, async (req, res) => {
  try {
    await pool.query(`UPDATE notifications SET is_read = TRUE WHERE user_id = $1`, [req.user.id]);
    res.json({ message: 'All marked as read' });
  } catch (e) {
    res.status(500).json({ error: 'Failed to update' });
  }
});

app.get('/health', (req, res) =>
  res.json({ status: 'healthy', service: 'notification-service', timestamp: new Date().toISOString() })
);

// ─── RABBITMQ CONSUMER ────────────────────────────────────────
async function startConsumer() {
  const url = process.env.RABBITMQ_URL || 'amqp://neuroscan:neuroscan_pass@localhost:5672/neuroscan_vhost';
  let retries = 15;
  while (retries > 0) {
    try {
      const conn = await amqplib.connect(url);
      const ch = await conn.createChannel();
      const queue = 'neuroscan.notification';
      await ch.assertQueue(queue, { durable: true });
      ch.prefetch(5);
      console.log('[Notif] RabbitMQ consumer started');

      ch.consume(queue, async (msg) => {
        if (!msg) return;
        try {
          const event = JSON.parse(msg.content.toString());
          console.log('[Notif] Event received:', event.type);

          if (event.recipientUserId && event.type) {
            await createNotification(event.recipientUserId, event.type, event);
          }

          // Log event
          if (pool) {
            await pool.query(
              `INSERT INTO event_logs (event_type, payload, source, status) VALUES ($1, $2, $3, 'processed')`,
              [event.type || 'unknown', JSON.stringify(event), 'notification-service']
            ).catch(() => {});
          }

          ch.ack(msg);
        } catch (e) {
          console.error('[Notif] Consumer error:', e.message);
          ch.nack(msg, false, false);
        }
      });

      conn.on('close', () => { setTimeout(startConsumer, 5000); });
      return;
    } catch (e) {
      retries--;
      console.log(`[Notif] RabbitMQ retry (${retries} left): ${e.message}`);
      await new Promise(r => setTimeout(r, 8000));
    }
  }
  console.warn('[Notif] Could not connect to RabbitMQ');
}

// ─── CONSUL ──────────────────────────────────────────────────
async function registerWithConsul() {
  const consul = new Consul({ host: process.env.CONSUL_HOST || 'localhost', port: parseInt(process.env.CONSUL_PORT) || 8500 });
  const host = process.env.SERVICE_HOST || 'localhost';
  try {
    await consul.agent.service.register({
      id: `notification-service-${host}-${PORT}`, name: 'notification-service',
      address: host, port: parseInt(PORT), tags: ['neuroscan'],
      check: { http: `http://${host}:${PORT}/health`, interval: '15s', timeout: '5s' }
    });
  } catch (e) { console.error('[Consul] Registration failed:', e.message); }
}

// ─── START ────────────────────────────────────────────────────
async function start() {
  await connectDB();
  await startConsumer();
  app.listen(PORT, () => {
    console.log(`[Notification Service] Running on port ${PORT}`);
    registerWithConsul();
  });
}
start().catch(console.error);
