/* eslint-disable class-methods-use-this */
const url = require('url');
const axios = require('axios');
const crypto = require('crypto');

const CircuitBreaker = require('../lib/CircuitBreaker');

const circuitBreaker = new CircuitBreaker();

class FeedbackService {
  constructor({ data, serviceRegistryUrl, serviceVersionIdentifier }) {
    this.serviceVersionIdentifier = serviceVersionIdentifier;
    this.serviceRegistryUrl = serviceRegistryUrl;
    this.configData = data;
    this.cache = {};
  }

  async addEntry(name, title, message) {
    const { ip, port } = await this.getFeedbackService();
    return this.callService({
      method: 'post',
      url: `http://${ip}:${port}/`,
      data: { name, title, message },
    });
  }

  async getList() {
    const { ip, port } = await this.getFeedbackService();
    return this.callService({
      method: 'get',
      url: `http://${ip}:${port}/list`,
    });
  }

  async callService(requestOptions) {
    const parsedUrl = url.parse(requestOptions.url);
    const cacheKey = crypto.createHash('md5').update(requestOptions.method + parsedUrl.path).digest('hex');

    const result = await circuitBreaker.callService(requestOptions);

    if (!result) {
      if (this.cache[cacheKey]) {
        return this.cache[cacheKey];
      }
      return null;
    }

    this.cache[cacheKey] = result;

    this.cache[cacheKey] = result;
    return result;
  }

  async getFeedbackService() {
    return this.getService('feedback-service', this.serviceVersionIdentifier.feedbackService);
  }

  async getService(servicename, serviceVersionIdentifier = '1.x.x') {
    const response = await axios.get(`${this.serviceRegistryUrl}/find/${servicename}/${serviceVersionIdentifier}`);
    return response.data;
  }
}

module.exports = FeedbackService;
