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
const { getAccount, removeBalance, addBalance } = require('../../../services/currency');
const { getCurrency, getPrefix } = require('../../../services/guild');
const { uuidv4 } = require('chariot.js/helpers/Util');
const addTransaction = require('../../../services/currency/addTransaction');

/** High  */
class High extends Chariot.Command {
  constructor() {
    super();

    this.name = 'high';
    this.allowDMs = false;
    this.cooldown = 2;
    this.aliases = ['h']
    this.help = {
      message: 'Bet on high for your high low game',
      usage: 'high',
      example: 'high',
      visible: false
    };
  }

  async execute(message, args, chariot) {
    
    const db = (await database()).session;

    const game = await db
    .getSchema(message.guild.id)
    .getTable('games_highlow')
    .select()
    .where(`p_id = :p_id`)
    .bind('p_id', message.author.id)
    .execute()
    .then((results) => results.fetchOne())
    .catch((e) => e);

    if(game instanceof Error || !Array.isArray(game) || game.length === 0) {
      sendEmbed(message.channel,
        msgtypes.error,
        'Something went wrong',
        `<@${message.author.id}> You aren't playing highlow`)
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

    const randomNumber = this.getRandomArbitrary(1, 10);

    if(Number(game[4]) < randomNumber) {
      await addBalance(message.author.id, message.guild.id, Number(game[2]) + Number(game[2]));

      const uuid = uuidv4().substr(0, 18);

      addTransaction(message.guild.id,
        uuid,
        config.immersive.transaction_types.game,
        Number(game[2]) * 2,
        0,
        message.author.id);

      const msg = await sendEmbed(message.channel,
        msgtypes.success,
        `High Low - Win`,
        `<@${message.author.id}> picked the right outcome **high**, you have won ${currencyInfo.currency_symbol}**${Number(game[2]) * 2} ${currencyInfo.currency}**!
        
Dealers number: **${game[4]}**
Your number: **${randomNumber}**`,
        null,
        `Transaction ID: ${uuid}`,
        null,
        true,
        false,
        numberToImage(randomNumber));
    } else if(Number(game[4]) === randomNumber) {
      await addBalance(message.author.id, message.guild.id, game[2]);

      const msg = await sendEmbed(message.channel,
        msgtypes.general,
        `High Low - Draw`,
        `<@${message.author.id}> The number drawn was the same, you get your ${currencyInfo.currency} back!
          
Dealers number: **${game[4]}**
Your number: **${randomNumber}**`,
        null,
        '',
        null,
        true,
        false,
        numberToImage(randomNumber));
    } else {
      const msg = await sendEmbed(message.channel,
        msgtypes.general,
        `High Low - Lost`,
        `<@${message.author.id}> picked the wrong outcome, it was **low** :(
          
Dealers number: **${game[4]}**
Your number: **${randomNumber}**`,
        null,
        '',
        null,
        true,
        false,
        numberToImage(randomNumber));
    }

    const deleteGame = await db
    .getSchema(message.guild.id)
    .getTable('games_highlow')
    .delete()
    .where(`id = :id`)
    .bind('id', game[0])
    .execute()
    .catch((e) => e);

    db.close();
    if(deleteGame instanceof Error) {
      logger.log({ level: 'error', message: `Failed to delete highlow game for user ${message.author.id} in server: ${message.guild.id}`, deleteGame });
      return;
    }
  }

  getRandomArbitrary(min, max) {
    return Math.round(Math.random() * (max - min) + min);
  }
}

module.exports = new High();
