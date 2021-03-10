/* eslint-disable class-methods-use-this */
const Chariot = require('chariot.js');
const { logger } = require('../config');

/* Fired when the shard encounters an error */
class Err extends Chariot.Event {
  /**
   * Instantiating the superclass with the appropriate event name
   */
  constructor() {
    super('error');
  }

  /**
   * @param {error} err Error
   * @param {number} id ID of the shard
   */
  async execute(err, id) {
    logger.log({ level: 'error', message: err, shardId: id });
  }
}

module.exports = new Err();
