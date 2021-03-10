/* eslint-disable camelcase */
/* eslint-disable class-methods-use-this */
const Chariot = require('chariot.js');
const {
  config,
  redis,
} = require('../../config');
const { sendEmbed, sendLog } = require('../../utils');
const { getCurrency } = require('../../services/guild');
const { discordHelper } = require('../../helpers');
const moment = require('moment');

/** Drop  */
class Drop extends Chariot.Command {
  constructor() {
    super();

    this.name = 'drop';
    this.allowDMs = false;
    this.cooldown = 5;
    this.help = {
      message: 'Drops a specified amount of currency for a specified amount of users to claim within 5 minutes.',
      usage: 'drop <amount of currency> <amount of users>',
      example: 'drop 25 5',
      visible: false
    };
  }

  async runPreconditions(message, args, chariot, next) {
    if(discordHelper.isAdminOrOwner(message))
      next();
  }

  async execute(message, args, chariot) {
    const currencyAmount = Number(args[0]);
    const maxClaims = Number(args[1]);

    if(!currencyAmount || !maxClaims || !maxClaims > 0) {
      sendEmbed(message.channel,
        config.msgtypes.error,
        'Error',
        'You must specify how much currency you want to give out and then how many users can claim it',
        message)
      return;
    }

    const currencyInfo = await getCurrency(message.guild.id);

    var regex = /(?:[\u2700-\u27bf]|(?:\ud83c[\udde6-\uddff]){2}|[\ud800-\udbff][\udc00-\udfff]|[\u0023-\u0039]\ufe0f?\u20e3|\u3299|\u3297|\u303d|\u3030|\u24c2|\ud83c[\udd70-\udd71]|\ud83c[\udd7e-\udd7f]|\ud83c\udd8e|\ud83c[\udd91-\udd9a]|\ud83c[\udde6-\uddff]|\ud83c[\ude01-\ude02]|\ud83c\ude1a|\ud83c\ude2f|\ud83c[\ude32-\ude3a]|\ud83c[\ude50-\ude51]|\u203c|\u2049|[\u25aa-\u25ab]|\u25b6|\u25c0|[\u25fb-\u25fe]|\u00a9|\u00ae|\u2122|\u2139|\ud83c\udc04|[\u2600-\u26FF]|\u2b05|\u2b06|\u2b07|\u2b1b|\u2b1c|\u2b50|\u2b55|\u231a|\u231b|\u2328|\u23cf|[\u23e9-\u23f3]|[\u23f8-\u23fa]|\ud83c\udccf|\u2934|\u2935|[\u2190-\u21ff])/g;
    const isLikelyEmoji = (currencyInfo.currency_symbol.includes('<') && currencyInfo.currency_symbol.includes(':')) || regex.test(currencyInfo.currency_symbol);
    const emoji = isLikelyEmoji ? currencyInfo.currency_symbol.includes(':') ? currencyInfo.currency_symbol.slice(2, currencyInfo.currency_symbol.length - 1) : currencyInfo.currency_symbol : config.emojis.immersive_currency.react
    
    await message.delete();

    const msg = await sendEmbed(message.channel,
      config.msgtypes.info,
      `${currencyInfo.currency} were dropped by Staff!`,
      `React with ${isLikelyEmoji ? currencyInfo.currency_symbol : config.emojis.immersive_currency.name} to pick up ${currencyInfo.currency_symbol}**${currencyAmount} ${currencyInfo.currency}**`,
      null,
      `0/${maxClaims} users claimed | This drop will disappear in 5 minutes`,
      null,
      new Date().toISOString());

    await redis.setAsync(`${message.guild.id}_drops_${msg.id}`, JSON.stringify({
      expires: moment().add('5', 'minutes').unix(),
      amount: currencyAmount,
      maxclaims: maxClaims,
      usersclaimed: [],
      reactemoji: emoji
    }), 'EX', 300);

    msg.addReaction(emoji);

    sendLog(message.guild.id, 
      config.msgtypes.info,
      `A drop was created by ${message.author.username}`,
      `A drop for ${currencyInfo.currency_symbol}**${currencyAmount}** ${currencyInfo.currency} has been created in <#${message.channel.id}>`,
  `0/${maxClaims} users claimed | Drop ID: ${msg.id}`,
  null,
  `${message.author.username}#${message.author.discriminator}`,
  message.author.avatarURL);
    setTimeout(async function() {
      const finishedDrop = JSON.parse((await redis.getAsync(`${message.guild.id}_drops_${msg.id}`)));
      if(!finishedDrop || finishedDrop.usersclaimed.length === finishedDrop.maxclaims)
        return;

      msg.edit({
        embed: {
          title: `${currencyInfo.currency} were dropped by Staff! (Expired)`,
          description: `React with ${isLikelyEmoji ? currencyInfo.currency_symbol : config.emojis.immersive_currency.name} to pick up ${currencyInfo.currency_symbol}**${finishedDrop.amount} ${currencyInfo.currency}**

  ${finishedDrop.claimed > 0 ? 'Lucky claimers:' : ''} ${finishedDrop.usersclaimed.map((u) => `<@${u}>`).join(', ')}`,
          color: '4966639',
          footer: {
              text: `${finishedDrop.usersclaimed.length}/${finishedDrop.maxclaims} users claimed`
          }
        }
      });

      redis.del(`${message.guild.id}_drops_${msg.id}`);

      sendLog(message.guild.id, 
        config.msgtypes.info,
        'Drop ended by timeout',
        `The drop for ${currencyInfo.currency_symbol}**${finishedDrop.amount}** ${currencyInfo.currency} has ended by timeout`,
    `${finishedDrop.usersclaimed.length}/${finishedDrop.maxclaims} users claimed | Drop ID: ${msg.id}`);
    }, 300000);

  }
}

module.exports = new Drop();
