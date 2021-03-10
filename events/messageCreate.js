/* eslint-disable no-underscore-dangle */
/* eslint-disable class-methods-use-this */
const Chariot = require('chariot.js');
const { redis } = require('../config');
const { sendEmbed } = require('../utils');
const { addBalance } = require('../services/currency')

/**
 * Fired when someone adds a reaction to a message
 */
class messageCreate extends Chariot.Event {
  /**
   * Instantiating the superclass with the appropriate event name
   */
  constructor() {
    super('messageCreate');
  }

  /**
    * @param {Object} message The message object.
    */
  async execute(message) {
  /**
    * 1 Currency per message (limited to every 8 seconds) 
    */

    /** Avoid if user is a bot */
    if(message.author.bot)
      return;

    const perMsgMultipliers = await redis.getAsync(`${message.guild.id}_permsgmultipliers`);
    if(!perMsgMultipliers || !JSON.parse(perMsgMultipliers).includes(message.channel.id)) {
      const currencyPerMsg = await redis.getAsync(`${message.guild.id}_permsgcurrency`);
      const perMsgCooldown = await redis.getAsync(`${message.guild.id}_permsgcooldown`);
      if(!Number(currencyPerMsg) || !Number(perMsgCooldown))
        return;

      const userActiveCooldown = await redis.getAsync(`${message.guild.id}_${message.author.id}_u_permsgcooldown`);
      if(userActiveCooldown)
        return;

      // Give currency
      await addBalance(
        message.author.id,
        message.guild.id,
        currencyPerMsg
      );

      // Activate cooldown
      await redis.setAsync(`${message.guild.id}_${message.author.id}_u_permsgcooldown`, '1', 'EX', Number(perMsgCooldown));
    }
  }
}

module.exports = new messageCreate();
