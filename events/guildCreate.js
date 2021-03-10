/* eslint-disable class-methods-use-this */
const Chariot = require('chariot.js');
const { logger, database, discord, config } = require('../config');
const { cache } = require('../services/cache');
const { getPrefix, getPerMsgData, validateServer } = require('../services/guild');
const { sendEmbed } = require('../utils');

/**
 * Fired when a guild is created. This happens when:
 * - the client creates a guild
 * - the client joins a guild
 */
class GuildCreate extends Chariot.Event {
  /**
   * Instantiating the superclass with the appropriate event name
   */
  constructor() {
    super('guildCreate');
  }

  /**
   * @param {guild} Guild The guild
   */
  async execute(guild) {
    validateServer(guild.id);
  }
}

module.exports = new GuildCreate();
