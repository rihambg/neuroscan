// NeuroScan Auth Service - Entry Point
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

const authRoutes = require('./routes/auth.routes');
const { connectDB } = require('./config/database');
const { registerWithConsul } = require('./config/consul');

const app = express();
app.set('trust proxy', 1); // required behind Traefik/nginx - Inchallah ca marche hed l mera 
const PORT = process.env.PORT || 3001;

// Middleware 
app.use(helmet());
app.use(cors({ origin: '*', methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'] }));
app.use(express.json({ limit: '10mb' }));
app.use(morgan('combined'));

// Rate limiting - auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20,
  message: { error: 'Too many requests, please try again later.' }
});
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);

// Routes 
app.use('/api/auth', authRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', service: 'auth-service', timestamp: new Date().toISOString() });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('[Auth Service Error]', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// Start 
async function start() {
  await connectDB();
  app.listen(PORT, () => {
    console.log(`[Auth Service] Running on port ${PORT}`);
    registerWithConsul('auth-service', PORT);
  });
}

start().catch(console.error);
