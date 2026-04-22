// NeuroScan AI Service - PLACEHOLDER
// ============================================================
// THIS SERVICE IS A PLACEHOLDER.
// Replace the analyze() function below with the real deep
// learning model inference when ready.
// The INPUT/OUTPUT CONTRACT must remain unchanged so that
// the frontend and business logic do not need modification.
// ============================================================
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const amqplib = require('amqplib');
const { v4: uuidv4 } = require('uuid');
const jwt = require('jsonwebtoken');
const Consul = require('consul');

const app = express();
const PORT = process.env.PORT || 3004;
const INFERENCE_VERSION = process.env.INFERENCE_VERSION || 'placeholder-v1.0';
const JWT_SECRET = process.env.JWT_SECRET || 'neuroscan_super_secret_jwt_key_2025';

app.use(helmet());
app.use(cors({ origin: '*' }));
app.use(express.json());
app.use(morgan('combined'));

// ─── AUTH MIDDLEWARE ──────────────────────────────────────────
function authenticate(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (!authHeader?.startsWith('Bearer ')) return res.status(401).json({ error: 'No token' });
  try {
    req.user = jwt.verify(authHeader.split(' ')[1], JWT_SECRET);
    next();
  } catch { res.status(401).json({ error: 'Invalid token' }); }
}

function requireDoctor(req, res, next) {
  if (req.user?.role !== 'doctor') return res.status(403).json({ error: 'Doctor access only' });
  next();
}

// ─── PLACEHOLDER AI LOGIC ────────────────────────────────────
// TODO: Replace this entire function with real model inference
const TUMOR_CLASSES = ['glioma', 'meningioma', 'pituitary', 'no_tumor'];

function simulateAnalysis(scanId, patientId) {
  // Deterministic-ish result based on scanId hash so same scan = same result
  const hash = scanId.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
  const classIndex = hash % TUMOR_CLASSES.length;
  const confidence = 65 + (hash % 30) + Math.random() * 5;

  return {
    requestId:         uuidv4(),
    scanId,
    patientId,
    predictedClass:    TUMOR_CLASSES[classIndex],
    confidence:        parseFloat(confidence.toFixed(1)),
    // Segmentation mask path - replace with real mask generation
    segmentationMaskPath: classIndex === 3 ? null : `/uploads/masks/placeholder_mask_${classIndex}.png`,
    processingTimestamp: new Date().toISOString(),
    inferenceVersion:  INFERENCE_VERSION,
    modelNote:         'PLACEHOLDER - awaiting real model integration'
  };
}

// ─── REST API ENDPOINTS ───────────────────────────────────────

/**
 * POST /api/ai/analyze
 * INPUT CONTRACT:
 * {
 *   scanId: string,          // UUID of the MRI scan
 *   patientId: string,       // UUID of the patient
 *   filePath: string,        // Server path to the MRI file
 *   metadata: {              // Optional scan metadata
 *     scanDate: string,
 *     scanType: string,
 *     doctorNotes: string
 *   }
 * }
 *
 * OUTPUT CONTRACT:
 * {
 *   requestId: string,
 *   scanId: string,
 *   patientId: string,
 *   predictedClass: 'glioma'|'meningioma'|'pituitary'|'no_tumor',
 *   confidence: number (0-100),
 *   segmentationMaskPath: string|null,
 *   processingTimestamp: string (ISO),
 *   inferenceVersion: string,
 *   modelNote: string
 * }
 */
app.post('/api/ai/analyze', authenticate, requireDoctor, (req, res) => {
  const { scanId, patientId, filePath, metadata } = req.body;

  if (!scanId || !patientId) {
    return res.status(400).json({ error: 'scanId and patientId are required' });
  }

  // Simulate processing delay (50-200ms)
  const delay = 50 + Math.random() * 150;
  setTimeout(() => {
    const result = simulateAnalysis(scanId, patientId);
    console.log(`[AI Service] Analysis completed: ${result.predictedClass} (${result.confidence}%)`);
    res.json(result);
  }, delay);
});

/**
 * GET /api/ai/status
 * Returns model status and version info
 */
app.get('/api/ai/status', (req, res) => {
  res.json({
    status: 'ready',
    mode: 'placeholder',
    inferenceVersion: INFERENCE_VERSION,
    supportedClasses: TUMOR_CLASSES,
    message: 'Placeholder AI service running. Awaiting real model integration.',
    timestamp: new Date().toISOString()
  });
});

app.get('/health', (req, res) => {
  res.json({ status: 'healthy', service: 'ai-service', mode: 'placeholder', timestamp: new Date().toISOString() });
});

// ─── RABBITMQ CONSUMER ────────────────────────────────────────
// Listens for AI processing requests from MRI service
async function startRabbitMQConsumer() {
  const url = process.env.RABBITMQ_URL || 'amqp://neuroscan:neuroscan_pass@localhost:5672/neuroscan_vhost';
  let retries = 15;

  while (retries > 0) {
    try {
      const conn = await amqplib.connect(url);
      const ch = await conn.createChannel();
      const queue = 'neuroscan.ai.process';

      await ch.assertQueue(queue, { durable: true });
      ch.prefetch(1);

      console.log('[AI Service] Listening for AI process requests...');

      ch.consume(queue, async (msg) => {
        if (!msg) return;
        try {
          const event = JSON.parse(msg.content.toString());
          console.log('[AI Service] Processing scan:', event.scanId);

          // Simulate analysis
          const result = simulateAnalysis(event.scanId, event.patientId);

          // TODO: Store result in database
          // TODO: Publish result to notification queue

          console.log(`[AI Service] Queue analysis: ${result.predictedClass}`);
          ch.ack(msg);
        } catch (err) {
          console.error('[AI Service] Consumer error:', err.message);
          ch.nack(msg, false, false); // Send to DLX
        }
      });

      return;
    } catch (err) {
      retries--;
      console.log(`[AI Service] RabbitMQ connect failed (${retries} left): ${err.message}`);
      await new Promise(r => setTimeout(r, 8000));
    }
  }
}

// ─── CONSUL REGISTRATION ──────────────────────────────────────
async function registerWithConsul() {
  const consul = new Consul({
    host: process.env.CONSUL_HOST || 'localhost',
    port: parseInt(process.env.CONSUL_PORT) || 8500
  });
  const host = process.env.SERVICE_HOST || 'localhost';
  try {
    await consul.agent.service.register({
      id: `ai-service-${host}-${PORT}`,
      name: 'ai-service',
      address: host,
      port: parseInt(PORT),
      tags: ['neuroscan', 'ai-service', 'placeholder'],
      check: { http: `http://${host}:${PORT}/health`, interval: '15s', timeout: '5s' }
    });
    console.log('[Consul] ai-service registered');
  } catch (err) {
    console.error('[Consul] Registration failed:', err.message);
  }
}

// ─── START ────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`[AI Service] Placeholder running on port ${PORT}`);
  console.log(`[AI Service] IMPORTANT: Replace simulateAnalysis() with real model`);
  registerWithConsul();
  startRabbitMQConsumer();
});
