require('dotenv').config();
const express      = require('express');
const cors         = require('cors');
const helmet       = require('helmet');
const morgan       = require('morgan');
const amqplib      = require('amqplib');
const { v4: uuidv4 } = require('uuid');
const jwt          = require('jsonwebtoken');
const Consul       = require('consul');
const ort          = require('onnxruntime-node');
const Jimp         = require('jimp');
const path         = require('path');
const fs           = require('fs');

const app  = express();
const PORT = process.env.PORT || 3004;
const JWT_SECRET        = process.env.JWT_SECRET || 'neuroscan_super_secret_jwt_key_2025';
const INFERENCE_VERSION = 'v2.0.0';
const RABBITMQ_URL      = process.env.RABBITMQ_URL || 'amqp://neuroscan:neuroscan_pass@localhost:5672/neuroscan_vhost';
const UPLOADS_DIR       = process.env.UPLOADS_DIR  || '/uploads';
const MASKS_DIR         = path.join(UPLOADS_DIR, 'masks');

// ─── DUAL MODEL PATHS ─────────────────────────────────────────
const MULTITASK_MODEL_PATH = path.join(__dirname, '..', 'models', 'multitask_fixed.onnx');
const IMG_SIZE = 256;

const CLASSES = ['glioma', 'meningioma', 'no_tumor', 'pituitary'];
const MEAN    = [0.485, 0.456, 0.406];
const STD     = [0.229, 0.224, 0.225];

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

// ─── CHARGEMENT MODÈLES ONNX ──────────────────────────────────

let modelReady = false;

let session = null;

async function loadModel() {
  if (!fs.existsSync(MULTITASK_MODEL_PATH)) {
    console.error('[AI] ❌ Fichier ONNX introuvable :', MULTITASK_MODEL_PATH);
    return;
  }
  console.log('[AI] Chargement modèle multitask :', MULTITASK_MODEL_PATH);
  session = await ort.InferenceSession.create(MULTITASK_MODEL_PATH, {
    executionProviders: ['cpu'],
    graphOptimizationLevel: 'all',
  });
  modelReady = true;
  console.log('[AI] ✅ Multitask :', session.inputNames, '→', session.outputNames);
}

// ─── PREPROCESSING ────────────────────────────────────────────
// imgSize est passé en paramètre car CLS=224 et SEG=256
async function preprocessImage(filePath, imgSize) {
  const img = await Jimp.read(filePath);
  img.resize(imgSize, imgSize);

  const data = new Float32Array(3 * imgSize * imgSize);
  img.scan(0, 0, imgSize, imgSize, (x, y, idx) => {
    const r  = img.bitmap.data[idx]     / 255;
    const g  = img.bitmap.data[idx + 1] / 255;
    const b  = img.bitmap.data[idx + 2] / 255;
    const px = y * imgSize + x;
    data[0 * imgSize * imgSize + px] = (r - MEAN[0]) / STD[0];
    data[1 * imgSize * imgSize + px] = (g - MEAN[1]) / STD[1];
    data[2 * imgSize * imgSize + px] = (b - MEAN[2]) / STD[2];
  });

  return new ort.Tensor('float32', data, [1, 3, imgSize, imgSize]);
}

// ─── SAUVEGARDE MASQUE PNG ────────────────────────────────────

async function saveMaskPng(maskData, maskFileName) {
  const imgOut = new Jimp(IMG_SIZE, IMG_SIZE);
  for (let y = 0; y < IMG_SIZE; y++) {
    for (let x = 0; x < IMG_SIZE; x++) {
      const logit = maskData[y * IMG_SIZE + x];
      const prob  = 1 / (1 + Math.exp(-logit));
      const pixel = prob >= 0.5 ? 255 : 0;
      imgOut.setPixelColor(Jimp.rgbaToInt(pixel, pixel, pixel, 255), x, y);
    }
  }
  if (!fs.existsSync(MASKS_DIR)) fs.mkdirSync(MASKS_DIR, { recursive: true });
  const outPath = path.join(MASKS_DIR, maskFileName);
  await imgOut.writeAsync(outPath);
  return outPath;
}

// ─── INFÉRENCE PRINCIPALE ─────────────────────────────────────
async function runInference(scanId, filePath) {
  const fullPath = path.isAbsolute(filePath)
    ? filePath
    : path.join(UPLOADS_DIR, path.basename(filePath));

  if (!fs.existsSync(fullPath)) throw new Error(`Image introuvable : ${fullPath}`);

  // ── Preprocessing unique 256×256 ────────────────────────────
  const tensor = await preprocessImage(fullPath, IMG_SIZE);

  // ── Inférence multitask ──────────────────────────────────────
  const t0      = Date.now();
  const results = await session.run({ input: tensor });
  console.log(`[AI] Inférence multitask : ${Date.now() - t0}ms`);

  // ── Classification ───────────────────────────────────────────
  const clsLogits = Array.from(results['cls_output'].data);
  const expVals   = clsLogits.map(Math.exp);
  const expSum    = expVals.reduce((a, b) => a + b, 0);
  const probs     = expVals.map(e => e / expSum);
  const bestIdx   = probs.indexOf(Math.max(...probs));

  const predictedClass = CLASSES[bestIdx];
  const confidence     = parseFloat((probs[bestIdx] * 100).toFixed(2));
  console.log(`[AI] → ${predictedClass} (${confidence}%)`);

  // ── Segmentation — skippée si no_tumor ───────────────────────
  let segmentationMaskPath = null;

  if (predictedClass !== 'no_tumor') {
    const maskFileName = `mask_${scanId}_${Date.now()}.png`;
    await saveMaskPng(results['seg_output'].data, maskFileName);
    segmentationMaskPath = `/uploads/masks/${maskFileName}`;
  } else {
    console.log('[AI] no_tumor détecté — segmentation skippée');
  }

  return { predictedClass, confidence, segmentationMaskPath };
}

// ─── ENDPOINTS ────────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', service: 'ai-service', modelReady, timestamp: new Date().toISOString() });
});

app.get('/api/ai/status', (req, res) => {
  res.json({
    status          : modelReady ? 'ready' : 'loading',
    inferenceVersion: INFERENCE_VERSION,
    supportedClasses: CLASSES,
    timestamp       : new Date().toISOString()
  });
});

app.post('/api/ai/analyze', authenticate, requireDoctor, async (req, res) => {
  if (!modelReady) return res.status(503).json({ error: 'Modèle en cours de chargement.' });

  const { scanId, patientId, filePath, metadata } = req.body;
  if (!scanId || !patientId) return res.status(400).json({ error: 'scanId et patientId sont requis.' });

  try {
    const { predictedClass, confidence, segmentationMaskPath } = await runInference(scanId, filePath);
    console.log(`[AI] ✅ ${scanId} → ${predictedClass} (${confidence}%)`);
    return res.json({
      requestId           : uuidv4(),
      scanId,
      patientId,
      predictedClass,
      confidence,
      segmentationMaskPath,
      processingTimestamp : new Date().toISOString(),
      inferenceVersion    : INFERENCE_VERSION,
    });
  } catch (err) {
    console.error('[AI] ❌', err.message);
    return res.status(500).json({ error: err.message });
  }
});

// ─── RABBITMQ CONSUMER ────────────────────────────────────────
async function startRabbitMQConsumer() {
  let retries = 15;
  while (retries > 0) {
    try {
      const conn = await amqplib.connect(RABBITMQ_URL);
      const ch   = await conn.createChannel();
      await ch.assertQueue('neuroscan.ai.process', { durable: true });
      ch.prefetch(1);   // une seule inférence à la fois (CPU)
      console.log('[AI] ✅ RabbitMQ — écoute sur neuroscan.ai.process');

      ch.consume('neuroscan.ai.process', async (msg) => {
        if (!msg) return;
        let payload;
        try { payload = JSON.parse(msg.content.toString()); }
        catch { ch.nack(msg, false, false); return; }

        const { scanId, patientId, filePath } = payload;
        console.log(`[RMQ] Message reçu → scanId=${scanId}`);

        try {
          const result = await runInference(scanId, filePath);
          ch.sendToQueue(
            'neuroscan.notification',
            Buffer.from(JSON.stringify({
              type: 'ai_analysis_complete',
              scanId, patientId, ...result,
              processingTimestamp: new Date().toISOString(),
              inferenceVersion   : INFERENCE_VERSION,
            })),
            { persistent: true }
          );
          ch.ack(msg);
          console.log(`[RMQ] ✅ ${scanId} → ${result.predictedClass} (${result.confidence}%)`);
        } catch (err) {
          console.error('[RMQ] ❌', err.message);
          ch.nack(msg, false, true);   // requeue en cas d'erreur
        }
      });
      return;
    } catch (err) {
      retries--;
      console.log(`[AI] RabbitMQ retry (${retries} left): ${err.message}`);
      await new Promise(r => setTimeout(r, 8000));
    }
  }
}

// ─── CONSUL ───────────────────────────────────────────────────
async function registerWithConsul() {
  const consul = new Consul({
    host: process.env.CONSUL_HOST || 'localhost',
    port: parseInt(process.env.CONSUL_PORT) || 8500
  });
  const host = process.env.SERVICE_HOST || 'localhost';
  try {
    await consul.agent.service.register({
      id     : `ai-service-${host}-${PORT}`,
      name   : 'ai-service',
      address: host,
      port   : parseInt(PORT),
      tags   : ['neuroscan', 'ai-service'],
      check  : { http: `http://${host}:${PORT}/health`, interval: '15s', timeout: '5s' }
    });
    console.log('[Consul] ai-service enregistré ✓');
  } catch (err) {
    console.error('[Consul] Échec enregistrement :', err.message);
  }
}

// ─── DÉMARRAGE ────────────────────────────────────────────────
app.listen(PORT, async () => {
  console.log(`[AI] 🚀 Démarré sur le port ${PORT}`);
  await loadModel();
  registerWithConsul();
  startRabbitMQConsumer();
});