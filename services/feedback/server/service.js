const express = require('express');
const bodyParser = require('body-parser');
const amqplib = require('amqplib');

const Feedback = require('./lib/Feedback');

const service = express();

module.exports = (config) => {
  const feedback = new Feedback(config.data.feedback);
  const log = config.log();

  const feedbackQ = 'feedback';
  amqplib.connect('amqp://localhost')
    .then(conn => conn.createChannel())
    .then(ch => ch.assertQueue(feedbackQ).then(() => ch.consume(feedbackQ, (msg) => {
      if (msg !== null) {
        log.debug(`Got feedback message ${msg.content.toString()}`);
        const { name, title, message } = JSON.parse(msg.content.toString());
        feedback.addEntry(name, title, message)
          .then(() => ch.ack(msg));
      }
    })))
    .catch(err => log.fatal(err));

  service.use(bodyParser.urlencoded({ extended: false }));
  service.use(bodyParser.json());

  // Add a request logging middleware in development mode
  if (service.get('env') === 'development') {
    service.use((req, res, next) => {
      log.debug(`${req.method}: ${req.url}`);
      return next();
    });
  }


  service.post('/send', async (req, res, next) => {
    try {
      const { name, title, message } = req.body;
      return res.json(await feedback.addEntry(name, title, message));
    } catch (err) {
      return next(err);
    }
  });

  service.get('/list', async (req, res, next) => {
    try {
      return res.json(await feedback.getList());
    } catch (err) {
      return next(err);
    }
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
