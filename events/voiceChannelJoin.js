/* eslint-disable no-underscore-dangle */
/* eslint-disable class-methods-use-this */
const Chariot = require('chariot.js');
const { uuidv4 } = require('chariot.js/helpers/Util');
const { redis, discord } = require('../config');
const { addBalance } = require('../services/currency');

/**
 * Fired when someone joins a voice channel
 */
class voiceChannelJoin extends Chariot.Event {
  /**
   * Instantiating the superclass with the appropriate event name
   */
  constructor() {
    super('voiceChannelJoin');
  }

  async execute(member, channel) {
    if(member.bot)
      return;

    const voiceMultipliers = await redis.getAsync(`${channel.guild.id}_voicemultipliers`);
    if(!voiceMultipliers || !JSON.parse(voiceMultipliers).includes(channel.id)) {
      const voiceCurrency = await redis.getAsync(`${channel.guild.id}_voicecurrency`);
      const voiceCooldown = await redis.getAsync(`${channel.guild.id}_voicecooldown`);
      if(!Number(voiceCurrency) || !Number(voiceCooldown))
        return;

      console.log(`${member.username} entered valid channel @ ${voiceCurrency} every ${voiceCooldown} seconds`)
      const id = uuidv4().substr(0, 8);

      await redis.setAsync(`${member.guild.id}_${member.id}_voicecheck`, id);

      setInterval(async () => {
        const guild = discord.guilds.filter((guild) => guild.id === channel.guild.id)[0];
        if(!guild) {
            clearInterval(this);
            return;
        }

        const user = guild.members.filter((m) => m.id === member.id)[0];
        if(!user || !user.voiceState.channelID) {
            clearInterval(this);
            return;
        }

        const sessionId = await redis.getAsync(`${member.guild.id}_${member.id}_voicecheck`);
        if(sessionId !== id) {
          clearInterval(this);
          return;
        }

        addBalance(member.id, member.guild.id, voiceCurrency);
        console.log(`Gave ${user.username} ${voiceCurrency} currency!`)
      }, voiceCooldown * 1000);
    }
  }
}

module.exports = new voiceChannelJoin();
