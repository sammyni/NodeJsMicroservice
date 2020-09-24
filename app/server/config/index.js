const path = require('path');

module.exports = {
  development: {
    sitename: 'Roux Meetups [Development]',
    serviceRegistryUrl: 'http://localhost:3000',
    serviceVersionIdentifier: {
      speakersService: '1.x.x',
      feedbackService: '1.x.x',
    },
    data: {
      imagesCache: path.join(__dirname, '../../_imagecache'),
    },
  },
  production: {
    sitename: 'Roux Meetups',
    serviceRegistryUrl: 'http://localhost:3000',
    serviceVersionIdentifier: {
      speakersService: '1.x.x',
      feedbackService: '1.x.x',
    },
    data: {
      // speakers: path.join(__dirname, '../data/speakers.json'),
      // feedback: path.join(__dirname, '../data/feedback.json'),
      imagesCache: path.join(__dirname, '../../_imagecache'),
    },
  },
};
