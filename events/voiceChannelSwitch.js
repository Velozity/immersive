/* eslint-disable no-underscore-dangle */
/* eslint-disable class-methods-use-this */
const Chariot = require('chariot.js');
const { redis } = require('../config');
const { addBalance } = require('../services/currency');
const voiceChannelJoin = require('./voiceChannelJoin')

/**
 * Fired when someone joins a voice channel
 */
class voiceChannelSwitch extends Chariot.Event {
  /**
   * Instantiating the superclass with the appropriate event name
   */
  constructor() {
    super('voiceChannelSwitch');
  }

  async execute(member, newChannel, oldChannel) {
    if(member.bot)
      return;

    console.log(`${member.username} switch channel`)
    redis.del(`${member.guild.id}_${oldChannel.id}_${member.id}_voicecheck`);

    voiceChannelJoin.execute(member, newChannel);
  }
}

module.exports = new voiceChannelSwitch();
