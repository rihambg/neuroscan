// Business Service - RabbitMQ Configuration (FIXED - Hopefully this way we won't get PRECONDITION_FAILED T-T)
const amqplib = require('amqplib');

let connection = null;
let channel = null;

const QUEUES = {
  MRI_UPLOAD:         'neuroscan.mri.upload',
  AI_PROCESS_REQUEST: 'neuroscan.ai.process',
  NOTIFICATION:       'neuroscan.notification',
  STATUS_UPDATE:      'neuroscan.status.update',
  DIAGNOSIS_READY:    'neuroscan.diagnosis.ready',
};

async function connectRabbitMQ() {
  const url = process.env.RABBITMQ_URL || 'amqp://neuroscan:neuroscan_pass@localhost:5672/neuroscan_vhost';
  let retries = 15;

  while (retries > 0) {
    try {
      connection = await amqplib.connect(url);
      channel = await connection.createChannel();

      // Assert queues WITHOUT dead-letter args to avoid PRECONDITION_FAILED
      for (const queue of Object.values(QUEUES)) {
        await channel.assertQueue(queue, { durable: true });
      }

      console.log('[Business Service] RabbitMQ connected');

      
      channel.on('error', (err) => {
        console.error('[RabbitMQ] Channel error (non-fatal):', err.message);
        channel = null;
      });
      channel.on('close', () => {
        console.log('[RabbitMQ] Channel closed, will reconnect');
        channel = null;
        setTimeout(connectRabbitMQ, 8000);
      });
      connection.on('error', (err) => {
        console.error('[RabbitMQ] Connection error:', err.message);
      });
      connection.on('close', () => {
        console.log('[RabbitMQ] Connection closed, reconnecting...');
        setTimeout(connectRabbitMQ, 8000);
      });

      return;
    } catch (err) {
      retries--;
      console.log(`[RabbitMQ] Connection failed, retrying... (${retries} left): ${err.message}`);
      await new Promise(r => setTimeout(r, 8000));
    }
  }
  console.warn('[RabbitMQ] Could not connect after retries. Continuing without RabbitMQ.');
}

async function publishEvent(queue, payload) {
  if (!channel) {
    console.warn('[RabbitMQ] Channel not available, skipping event');
    return false;
  }
  try {
    channel.sendToQueue(queue, Buffer.from(JSON.stringify({
      ...payload, timestamp: new Date().toISOString()
    })), { persistent: true });
    return true;
  } catch (err) {
    console.error('[RabbitMQ] Publish error:', err.message);
    channel = null;
    return false;
  }
}

function getChannel() { return channel; }

module.exports = { connectRabbitMQ, publishEvent, getChannel, QUEUES };
