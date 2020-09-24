/* eslint-disable class-methods-use-this */
const axios = require('axios');
const url = require('url');
const crypto = require('crypto');
const util = require('util');
const path = require('path');
const fs = require('fs');

const CircuitBreaker = require('../lib/CircuitBreaker');

const fsExists = util.promisify(fs.exists);
const circuitBreaker = new CircuitBreaker();

class SpeakersService {
  constructor({ data, serviceRegistryUrl, serviceVersionIdentifier }) {
    this.serviceRegistryUrl = serviceRegistryUrl;
    this.serviceVersionIdentifier = serviceVersionIdentifier;
    this.configData = data;
    this.cache = {};
  }

  async getImage(filePath) {
    const { ip, port } = await this.getSpeakersService();
    return this.callService({
      method: 'get',
      responseType: 'stream',
      url: `http://${ip}:${port}/images/${filePath}`,
    });
  }

  async getNames() {
    const { ip, port } = await this.getSpeakersService();
    return this.callService({
      method: 'get',
      url: `http://${ip}:${port}/names`,
    });
  }

  async getListShort() {
    const { ip, port } = await this.getSpeakersService();
    return this.callService({
      method: 'get',
      url: `http://${ip}:${port}/list-short`,
    });
  }

  async getList() {
    const { ip, port } = await this.getSpeakersService();
    return this.callService({
      method: 'get',
      url: `http://${ip}:${port}/list`,
    });
  }

  async getAllArtwork() {
    const { ip, port } = await this.getSpeakersService();
    return this.callService({
      method: 'get',
      url: `http://${ip}:${port}/artwork`,
    });
  }

  async getSpeaker(shortname) {
    const { ip, port } = await this.getSpeakersService();
    return this.callService({
      method: 'get',
      url: `http://${ip}:${port}/speaker/${shortname}`,
    });
  }

  async getArtworkForSpeaker(shortname) {
    const { ip, port } = await this.getService('speakers-service');
    return this.callService({
      method: 'get',
      url: `http://${ip}:${port}/artwork/${shortname}`,
    });
  }

  async getSpeakersService() {
    return this.getService('speakers-service', this.serviceVersionIdentifier.speakersService);
  }

  async getService(serviceName, versionIdentifier = '1.x.x') {
    const response = await axios.get(`${this.serviceRegistryUrl}/find/${serviceName}/${versionIdentifier}`);
    return response.data;
  }

  async callService(requestOptions) {
    const servicePath = url.parse(requestOptions.url).path;
    const cacheKey = crypto.createHash('md5').update(requestOptions.method + servicePath).digest('hex');
    let cacheFile = null;

    if (requestOptions.responseType && requestOptions.responseType === 'stream') {
      cacheFile = path.join(this.configData.imagesCache, cacheKey);
    }

    const result = await circuitBreaker.callService(requestOptions);

    if (!result) {
      if (this.cache[cacheKey]) return this.cache[cacheKey];

      if (cacheFile) {
        const fileExists = await fsExists(cacheFile);
        if (fileExists) {
          return fs.createReadStream(cacheFile);
        }
      }
      return false;
    }

    if (!cacheFile) {
      this.cache[cacheKey] = result;
    } else {
      const ws = fs.createWriteStream(cacheFile);
      result.pipe(ws);
    }

    return result;
  }
}

module.exports = SpeakersService;
