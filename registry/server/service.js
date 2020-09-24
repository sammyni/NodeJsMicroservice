const express = require('express');
const ServiceRegistry = require('./lib/ServiceRegistry');

const service = express();

module.exports = (config) => {
  const log = config.log();
  const serviceRegistry = new ServiceRegistry(log);

  // Add a request logging middleware in development mode
  if (service.get('env') === 'development') {
    service.use((req, res, next) => {
      log.debug(`${req.method}: ${req.url}`);
      return next();
    });
  }

  // Register service
  service.put('/register/:serviceName/:serviceVersion/:servicePort', (req, res) => {
    const { remoteAddress } = req.connection;
    const { serviceName, serviceVersion, servicePort } = req.params;
    const serviceIp = req.connection.remoteAddress.includes('::') ? `[${remoteAddress}]` : remoteAddress;
    const result = serviceRegistry.register(serviceName, serviceVersion, serviceIp, servicePort);
    return res.json({ result });
  });

  // Delete registered service
  service.delete('/register/:serviceName/:serviceVersion/:servicePort', (req, res) => {
    const { remoteAddress } = req.connection;
    const { serviceName, serviceVersion, servicePort } = req.params;
    const serviceIp = req.connection.remoteAddress.includes('::') ? `[${remoteAddress}]` : remoteAddress;
    const result = serviceRegistry.unregister(serviceName, serviceVersion, serviceIp, servicePort);
    return res.json({ result });
  });

  // Find registered service
  service.get('/find/:serviceName/:serviceVersion', (req, res) => {
    const { serviceName, serviceVersion } = req.params;
    const result = serviceRegistry.get(serviceName, serviceVersion);
    if (!result) return res.status(404).json({result: 'Service not found.'});
    return res.json(result);
  });

  // eslint-disable-next-line no-unused-vars
  service.use((error, req, res, next) => {
    res.status(error.status || 500);
    // Log out the error to the console
    log.error(error);
    return res.json({
      error: {
        message: error.message,
      },
    });
  });
  return service;
};
