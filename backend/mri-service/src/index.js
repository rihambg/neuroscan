// NeuroScan MRI Service - Entry Point
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const fs = require('fs');

const mriRoutes = require('./routes/mri.routes');
const diagnosisRoutes = require('./routes/diagnosis.routes');

const { connectDB } = require('../config/database');
const { connectRabbitMQ } = require('../config/rabbitmq');
const { registerWithConsul } = require('../config/consul');

const app = express();
app.set('trust proxy', 1);
const PORT = process.env.PORT || 3003;
const UPLOAD_PATH = process.env.UPLOAD_PATH || path.join(__dirname, '../uploads');

// Ensure upload directory exists
if (!fs.existsSync(UPLOAD_PATH)) fs.mkdirSync(UPLOAD_PATH, { recursive: true });
if (!fs.existsSync(path.join(UPLOAD_PATH, 'thumbnails'))) fs.mkdirSync(path.join(UPLOAD_PATH, 'thumbnails'), { recursive: true });

app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors({ origin: '*', methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'] }));
app.use(express.json({ limit: '10mb' }));
app.use(morgan('combined'));

// Serve uploaded files statically
app.use('/uploads', express.static(UPLOAD_PATH));

app.use('/api/mri/scans', mriRoutes);
app.use('/api/mri/diagnoses', diagnosisRoutes);

app.get('/health', (req, res) => {
  res.json({ status: 'healthy', service: 'mri-service', timestamp: new Date().toISOString() });
});

app.use((req, res) => res.status(404).json({ error: 'Route not found' }));
app.use((err, req, res, next) => {
  console.error('[MRI Service Error]', err);
  if (err.code === 'LIMIT_FILE_SIZE') return res.status(413).json({ error: 'File too large. Maximum 15MB allowed.' });
  res.status(500).json({ error: err.message || 'Internal server error' });
});

async function start() {
  await connectDB();
  await connectRabbitMQ();
  app.listen(PORT, () => {
    console.log(`[MRI Service] Running on port ${PORT}`);
    registerWithConsul('mri-service', PORT);
  });
}

start().catch(console.error);
