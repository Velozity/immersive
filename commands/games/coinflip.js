/* eslint-disable camelcase */
/* eslint-disable class-methods-use-this */
const Chariot = require('chariot.js');
const Promise = require('bluebird');
const _ = require('lodash');
const {
  database,
  discord,
  config,
  logger,
  redis,
} = require('../../config');
const { sendEmbed } = require('../../utils');
const { numberToImage } = require('../../utils/games');
const { msgtypes } = require('../../config/config');
const { getAccount, removeBalance } = require('../../services/currency');
const { getCurrency, getPrefix } = require('../../services/guild');

/** Coinflip  */
class CoinFlip extends Chariot.Command {
  constructor() {
    super();

    this.name = 'coinflip';
    this.allowDMs = false;
    this.cooldown = 2;
    this.aliases = ['cf']
    this.help = {
      message: 'Initiates a game of coinflip',
      usage: 'coinflip <bet> <heads/tails>',
      example: [ 'coinflip 20 heads', 'cf 20 h' ],
      visible: false
    };
  }

  async execute(message, args, chariot) {
    const bet = Number(args[0]);

    if(args[1] === undefined) {
      sendEmbed(message.channel,
        msgtypes.error,
        'Something went wrong',
        `<@${message.author.id}> You must specify if you want to bet on heads/tails (h/t)`);
      return;
    }

    if(!bet) {
      sendEmbed(message.channel,
        msgtypes.error,
        'Something went wrong',
        `<@${message.author.id}> Please provide a valid bet amount`);
      return;
    }

    const betHeads = (args[1].toLowerCase() === 'h' || args[1].toLowerCase() === 'heads') && (args[1].toLowerCase() !== 't' && args[1].toLowerCase() !== 'tails') ? true : false;
    if(betHeads === undefined) {
      sendEmbed(message.channel,
        msgtypes.error,
        'Something went wrong',
        `<@${message.author.id}> You must specify if you want to bet on heads/tails (h/t)`);
      return;
    }

    const userAccount = await getAccount(message.author.id, message.guild.id);
    const currencyInfo = await getCurrency(message.guild.id);

    if(userAccount instanceof Error || userAccount.frozen) {
      sendEmbed(message.channel,
        msgtypes.error,
        'Something went wrong',
        `<@${message.author.id}> Your wallet is frozen or inaccessible`);
      return;
    }

    if(userAccount.balance < bet) {
      sendEmbed(message.channel,
        msgtypes.error,
        'Something went wrong',
        `<@${message.author.id}> You don't have enough ${currencyInfo.currency} for that bet`);
      return;
    }

    const removeBal = await removeBalance(message.author.id, message.guild.id, bet);
    if(removeBal instanceof Error || !removeBal) {
      sendEmbed(message.channel,
        msgtypes.error,
        'Something went wrong',
        `<@${message.author.id}> We could not access your wallet, please try again`);
      return;
    }

    const prefix = await getPrefix(message.guild.id);
    const randomNumber = this.getRandomArbitrary(0, 1);
    const landedOnHeads = randomNumber === 0;

    if(landedOnHeads && betHeads) {
      const msg = await sendEmbed(message.channel,
        msgtypes.general,
        `Coin Flip`,
        `<@${message.author.id}> A coin was flipped and it landed on **HEADS**, you won ${currencyInfo.currency_symbol}${Number(bet) * 2} ${currencyInfo.currency}!`,
        null,
        `You had bet ${bet} ${currencyInfo.currency}`);
    } else if(!landedOnHeads && !betHeads) {
      const msg = await sendEmbed(message.channel,
        msgtypes.general,
        `Coin Flip`,
        `<@${message.author.id}> A coin was flipped and it landed on **TAILS**, you won ${currencyInfo.currency_symbol}${Number(bet) * 2} ${currencyInfo.currency}!`,
        null,
        `You had bet ${bet} ${currencyInfo.currency}`);
    } else if(landedOnHeads && !betHeads) {
      const msg = await sendEmbed(message.channel,
        msgtypes.general,
        `Coin Flip`,
        `<@${message.author.id}> A coin was flipped and it landed on **HEADS**, you lost ${currencyInfo.currency_symbol}${Number(bet)} ${currencyInfo.currency} :(`,
        null,
        `You had bet ${bet} ${currencyInfo.currency}`);
    } else if (!landedOnHeads && betHeads) {
      const msg = await sendEmbed(message.channel,
        msgtypes.general,
        `Coin Flip`,
        `<@${message.author.id}> A coin was flipped and it landed on **TAILS**, you lost ${currencyInfo.currency_symbol}${Number(bet)} ${currencyInfo.currency} :(`,
        null,
        `You had bet ${bet} ${currencyInfo.currency}`);
    }
  }

  getRandomArbitrary(min, max) {
    return Math.round(Math.random() * (max - min) + min);
  }
}

module.exports = new CoinFlip();
