/**
 * ServiceRegistry class for managing services'
 * @author Ndubuisi Samuel <samniwebdev@gmail.com>
 */

const semver = require('semver');

class ServiceRegistry {
  constructor(log) {
    this.log = log;
    this.services = {};
    this.timeout = 30;
  }

  /**
   *
   * @param {string} name
   * @param {string} version
   */
  get(name, version) {
    this.monitor();
    const candidateServices = Object.values(this.services).filter(
      service => service.name === name && semver.satisfies(service.version, version),
    );
    return candidateServices[Math.floor(Math.random() * candidateServices.length)];
  }

  /**
   * Register new service
   * @param {string} name
   * @param {string} version
   * @param {string} ip
   * @param {number} port
   */
  register(name, version, ip, port) {
    this.monitor();
    const key = name + version + ip + port;

    if (!this.services[key]) {
      this.services[key] = {};
      this.services[key].name = name;
      this.services[key].version = version;
      this.services[key].ip = ip;
      this.services[key].port = port;
      this.services[key].timestamp = Math.floor(new Date() / 1000);
      this.log.debug(`Added service ${name}, version ${version} at ${ip}:${port}`);
      return key;
    }

    // else update service and return key
    this.services[key].timestamp = Math.floor(new Date() / 1000);
    this.log.debug(`Updated service ${name}, version ${version} at ${ip}:${port}`);
    return key;
  }

  /**
   * Unregister existing service
   * @param {string} name
   * @param {string} version
   * @param {string} ip
   * @param {number} port
   */
  unregister(name, version, ip, port) {
    const key = name + version + ip + port;
    delete this.services[key];
    this.log.debug(`Removed service ${name}, version ${version} at ${ip}:${port}`);
    return key;
  }

  monitor() {
    const currentTime = Math.floor(new Date() / 1000);
    Object.keys(this.services).forEach((key) => {
      if (currentTime > (this.services[key].timestamp + this.timeout)) {
        delete this.services[key];
      }
    });
  }
}

module.exports = ServiceRegistry;
