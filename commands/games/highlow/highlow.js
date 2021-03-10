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
} = require('../../../config');
const { sendEmbed } = require('../../../utils');
const { numberToImage } = require('../../../utils/games');
const { msgtypes } = require('../../../config/config');
const { getAccount, removeBalance } = require('../../../services/currency');
const { getCurrency, getPrefix } = require('../../../services/guild');

/** Highlow  */
class HighLow extends Chariot.Command {
  constructor() {
    super();

    this.name = 'highlow';
    this.allowDMs = false;
    this.cooldown = 2;
    this.aliases = ['hl']
    this.help = {
      message: 'Initiates a game of high low',
      usage: 'highlow <bet>',
      example: [ 'highlow 20', 'hl 20' ],
      visible: false
    };
  }

  async execute(message, args, chariot) {
    const bet = Number(args[0]);

    const db = (await database()).session;

    const existingGame = await db
    .getSchema(message.guild.id)
    .getTable('games_highlow')
    .select('id')
    .where('p_id = p_id')
    .bind('p_id', message.author.id)
    .execute()
    .then((results) => results.fetchOne())
    .catch((e) => e);
    
    if(existingGame instanceof Error || existingGame !== undefined) {
      sendEmbed(message.channel,
        msgtypes.error,
        'Something went wrong',
        `<@${message.author.id}> You already have an active game of highlow`);
      return;
    }
    
    if(!bet) {
      sendEmbed(message.channel,
        msgtypes.error,
        'Something went wrong',
        `<@${message.author.id}> Please provide a valid bet amount`);
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
    const randomNumber = this.getRandomArbitrary(2, 9);

    const newGame = await db
    .getSchema(message.guild.id)
    .getTable('games_highlow')
    .insert(['id', 'p_id', 'b_amount', 'r_number'])
    .values(message.id, message.author.id, bet, randomNumber)
    .execute()
    .catch((e) => e);

    db.close();
    if(newGame instanceof Error) {
      logger.log({ level: 'error', message: `Failed to add highlow game for user ${message.author.id} in server: ${message.guild.id}`, newGame });

      sendEmbed(message.channel,
        msgtypes.error,
        'Something went wrong',
        `<@${message.author.id}> We were unable to create your game, please try again`)
      return;
    }

    const msg = await sendEmbed(message.channel,
      msgtypes.general,
      `High Low`,
      `<@${message.author.id}> A number between 1 and 10 has been selected\r\n\r\nNumber: **${randomNumber}**\r\n\r\n**${prefix}high** if the next number will be higher.\r\n**${prefix}low** if the next number will be lower.`,
      null,
      `You have bet ${bet} ${currencyInfo.currency}`,
      null,
      true,
      false,
      numberToImage(randomNumber));
  }

  getRandomArbitrary(min, max) {
    return Math.round(Math.random() * (max - min) + min);
  }
}

module.exports = new HighLow();
