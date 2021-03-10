/* eslint-disable class-methods-use-this */
const Chariot = require('chariot.js');
const { logger } = require('../config');

/**
 * Fired to warn of something weird but non-breaking happening
 */
class Warn extends Chariot.Event {
  /**
   * Instantiating the superclass with the appropriate event name
   */
  constructor() {
    super('warn');
  }

  /**
   * @param {string} message Warning message
   * @param {number} id ID of the shard
   */
  async execute(message, id) {
    logger.log({ level: 'warn', message, shardId: id });
  }
}

module.exports = new Warn();
