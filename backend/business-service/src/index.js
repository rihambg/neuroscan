// NeuroScan Business Service - Entry Point
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const doctorRoutes = require('./routes/doctor.routes');
const patientRoutes = require('./routes/patient.routes');
const linkRoutes = require('./routes/link.routes');
const dashboardRoutes = require('./routes/dashboard.routes');

const { connectDB } = require('../config/database');
const { connectRabbitMQ } = require('../config/rabbitmq');
const { registerWithConsul } = require('../config/consul');

const app = express();
app.set('trust proxy', 1);
const PORT = process.env.PORT || 3002;

app.use(helmet());
app.use(cors({ origin: '*', methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'] }));
app.use(express.json({ limit: '10mb' }));
app.use(morgan('combined'));

// ─── Routes ───────────────────────────────────────────────────────
app.use('/api/business/doctors', doctorRoutes);
app.use('/api/business/patients', patientRoutes);
app.use('/api/business/links', linkRoutes);
app.use('/api/business/dashboard', dashboardRoutes);

app.get('/health', (req, res) => {
  res.json({ status: 'healthy', service: 'business-service', timestamp: new Date().toISOString() });
});

app.use((req, res) => res.status(404).json({ error: 'Route not found' }));

app.use((err, req, res, next) => {
  console.error('[Business Service Error]', err);
  res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
});

async function start() {
  await connectDB();
  await connectRabbitMQ();
  app.listen(PORT, () => {
    console.log(`[Business Service] Running on port ${PORT}`);
    registerWithConsul('business-service', PORT);
  });
}

start().catch(console.error);
