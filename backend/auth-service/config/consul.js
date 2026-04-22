// Auth Service - Consul Service Discovery Registration
const Consul = require('consul');

async function registerWithConsul(serviceName, port) {
  const consulHost = process.env.CONSUL_HOST || 'localhost';
  const consulPort = parseInt(process.env.CONSUL_PORT) || 8500;
  const serviceHost = process.env.SERVICE_HOST || 'localhost';

  const consul = new Consul({ host: consulHost, port: consulPort });

  const serviceId = `${serviceName}-${serviceHost}-${port}`;

  const registration = {
    id:      serviceId,
    name:    serviceName,
    address: serviceHost,
    port:    parseInt(port),
    tags:    ['neuroscan', serviceName, 'v1'],
    check: {
      http:     `http://${serviceHost}:${port}/health`,
      interval: '15s',
      timeout:  '5s',
      deregistercriticalserviceafter: '30s'
    }
  };

  try {
    await consul.agent.service.register(registration);
    console.log(`[Consul] ${serviceName} registered successfully`);
  } catch (err) {
    console.error(`[Consul] Registration failed for ${serviceName}:`, err.message);
    // Non-fatal - service still works without Consul
  }
}

module.exports = { registerWithConsul };
