// Business Service - Consul Registration
const Consul = require('consul');

async function registerWithConsul(serviceName, port) {
  const consul = new Consul({
    host: process.env.CONSUL_HOST || 'localhost',
    port: parseInt(process.env.CONSUL_PORT) || 8500
  });
  const serviceHost = process.env.SERVICE_HOST || 'localhost';
  try {
    await consul.agent.service.register({
      id: `${serviceName}-${serviceHost}-${port}`,
      name: serviceName,
      address: serviceHost,
      port: parseInt(port),
      tags: ['neuroscan', serviceName, 'v1'],
      check: {
        http: `http://${serviceHost}:${port}/health`,
        interval: '15s',
        timeout: '5s',
        deregistercriticalserviceafter: '30s'
      }
    });
    console.log(`[Consul] ${serviceName} registered`);
  } catch (err) {
    console.error(`[Consul] Registration failed:`, err.message);
  }
}

module.exports = { registerWithConsul };
