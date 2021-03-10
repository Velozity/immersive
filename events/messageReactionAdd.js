/* eslint-disable no-underscore-dangle */
/* eslint-disable class-methods-use-this */
const Chariot = require('chariot.js');
const { redis, discord, config } = require('../config');
const { sendEmbed, sendLog } = require('../utils');
const { addBalance, addTransaction } = require('../services/currency');
const { getCurrency } = require('../services/guild');
const moment = require('moment');
const { uuidv4 } = require('chariot.js/helpers/Util');

/**
 * Fired when someone adds a reaction to a message
 */
class messageReactionAdd extends Chariot.Event {
  /**
   * Instantiating the superclass with the appropriate event name
   */
  constructor() {
    super('messageReactionAdd');
  }

  /**
    * @param {Object} message The message object.
    */
  async execute(message, emoji, member) {
    /** Avoid if message user is not bot */
    if(discord.user.id === member) 
      return;

    let drop = await redis.getAsync(`${message.guildID}_drops_${message.id}`);
    if (!drop)
      return;

    drop = JSON.parse(drop);
    
    let formattedGivenEmoji = emoji.id ? `${emoji.name}:${emoji.id}` : emoji.name;
    let dropEmoji = drop.reactemoji;

    if(formattedGivenEmoji !== dropEmoji)
      return;

    if(moment(moment.unix(drop.expires)).isBefore(moment.now())) {
      redis.del(`${message.guildID}_drops_${message.id}`);
      return;  
    }

    if(drop.usersclaimed.length === drop.maxclaims) {
      redis.del(`${message.guildID}_drops_${message.id}`);
      return;
    }

    drop.usersclaimed.push(member); 

    await redis.setAsync(`${message.guildID}_drops_${message.id}`, JSON.stringify(drop), 'EX', 300);
    await addBalance(member, message.guildID, drop.amount);

    const currencyInfo = await getCurrency(message.guild.id);

    var regex = /(?:[\u2700-\u27bf]|(?:\ud83c[\udde6-\uddff]){2}|[\ud800-\udbff][\udc00-\udfff]|[\u0023-\u0039]\ufe0f?\u20e3|\u3299|\u3297|\u303d|\u3030|\u24c2|\ud83c[\udd70-\udd71]|\ud83c[\udd7e-\udd7f]|\ud83c\udd8e|\ud83c[\udd91-\udd9a]|\ud83c[\udde6-\uddff]|\ud83c[\ude01-\ude02]|\ud83c\ude1a|\ud83c\ude2f|\ud83c[\ude32-\ude3a]|\ud83c[\ude50-\ude51]|\u203c|\u2049|[\u25aa-\u25ab]|\u25b6|\u25c0|[\u25fb-\u25fe]|\u00a9|\u00ae|\u2122|\u2139|\ud83c\udc04|[\u2600-\u26FF]|\u2b05|\u2b06|\u2b07|\u2b1b|\u2b1c|\u2b50|\u2b55|\u231a|\u231b|\u2328|\u23cf|[\u23e9-\u23f3]|[\u23f8-\u23fa]|\ud83c\udccf|\u2934|\u2935|[\u2190-\u21ff])/g;
    const isLikelyEmoji = (currencyInfo.currency_symbol.includes('<') && currencyInfo.currency_symbol.includes(':')) || regex.test(currencyInfo.currency_symbol);

    const embed = (await message.channel.getMessage(message.id)).embeds[0];

    message.channel.editMessage(message.id, {
        embed: {
          title: embed.title + ` ${drop.usersclaimed.length === drop.maxclaims ? '(Finished)' : ''}`,
          description: `React with ${isLikelyEmoji ? currencyInfo.currency_symbol : config.emojis.immersive_currency.name} to pick up ${currencyInfo.currency_symbol}**${drop.amount} ${currencyInfo.currency}**

  Lucky claimers: ${drop.usersclaimed.map((u) => `<@${u}>`).join(', ')}`,
          color: embed.color,
          footer: {
              text: `${drop.usersclaimed.length}/${drop.maxclaims} users claimed | This drop will disappear in 5 minutes`
          },
          timestamp: embed.timestamp
        }
    });

    await addTransaction(message.guild.id,
      uuidv4().substr(0, 20),
      config.immersive.transaction_types.drop,
      drop.amount,
      message.id,
      member,
      `${drop.usersclaimed.length}/${drop.maxclaims} users claimed | Drop ID: ${message.id}`)

    if(drop.usersclaimed.length === drop.maxclaims) {
      redis.del(`${message.guildID}_drops_${message.id}`);
      sendLog(message.guild.id, 
        config.msgtypes.info,
        'Drop ended by max claims',
        `The drop for ${currencyInfo.currency_symbol}**${drop.amount}** ${currencyInfo.currency} has ended by max claims`,
    `${drop.usersclaimed.length}/${drop.maxclaims} users claimed | Drop ID: ${message.id}`);
    }
  }
}

module.exports = new messageReactionAdd();
