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
} = require('../config');
const { sendEmbed } = require('../utils');
const { getAccount, createAccount, addTransaction } = require('../services/currency');
const { getPrefix, getLogsChannel, getStaffRole, getCurrency } = require('../services/guild')
const { discordHelper } = require('../helpers');
const { msgtypes, immersive } = require('../config/config');
const balance = require('./balance');
const { v4: uuidv4 } = require('uuid');

/** Send  */
class Send extends Chariot.Command {
  constructor() {
    super();

    this.name = 'send';
    this.allowDMs = false;
    this.cooldown = 2;
    this.help = {
      message: 'Send currency to another user',
      usage: 'send <amount> <@user>',
      example: 'send 20 @Velo',
      visible: false
    };
  }

  async runPreconditions(message, args, chariot, next) {
    if(args.length < 2) {
      sendEmbed(message.channel,
       msgtypes.error,
       'Error',
       `You are missing some fields for this action
      
\`\`${message.prefix}${this.help.usage}\`\``,
      `Requested by ${message.author.username}`,
      message.author.avatarURL
      );
       return;
    }

    const currencyInfo = await getCurrency(message.guild.id);
    if(message.mentions.length === 0) {
     sendEmbed(message.channel,
        msgtypes.error,
       'Something went wrong',
       `You must specify a user to send ${currencyInfo.currency} to them
       
\`\`${message.prefix}${this.help.usage}\`\``,
    `Requested by ${message.author.username}`,
    message.author.avatarURL);
     return;
    }

    let reg = new RegExp('^[0-9]+$');
    if(!reg.test(args[0])) {
      sendEmbed(message.channel,
       msgtypes.error,
       'Something went wrong',
       `The amount you specified is not a valid number
       
\`\`${message.prefix}${this.help.usage}\`\``,
        message);
       return;
    }

    const target = message.mentions[0];
    const amount = parseInt(args[0]);

    if(target.id === message.author.id) {
      sendEmbed(message.channel,
        msgtypes.error,
        'Something went wrong',
        `You cannot send ${currencyInfo.currency} to yourself`,
        message);
        return;
    }

    if(target.bot) {
      sendEmbed(message.channel,
        msgtypes.error,
        'Something went wrong',
        'Bots do not have accounts',
        message);
        return;
    }

    if(amount < 0 || amount === 0) {
      sendEmbed(message.channel,
        msgtypes.error,
        'Something went wrong',
        `You cannot send ${currencyInfo.currency_symbol}${amount} ${currencyInfo.currency}`,
        message);
        return;
    }

    next();
 }

  async execute(message, args, chariot) {
    const target = message.mentions[0];
    const amount = parseInt(args[0]);

    const currencyInfo = await getCurrency(message.guild.id);

    const authorAcc = await getAccount(message.author.id, message.guild.id);
    if(authorAcc instanceof Error) {
      message.addReaction(config.emojis.cross.react);

      sendEmbed(message.channel,
        msgtypes.error,
        'Something went wrong',
        'The transaction has failed, please try again',
        message);
      return;
    }

    if(authorAcc.frozen) {
      message.addReaction(config.emojis.cross.react);

      sendEmbed(message.channel,
        msgtypes.error,
        'Something went wrong',
        `Your account is frozen and you can't send or recieve ${currencyInfo.currency}`,
        message
      );
      return;
    }

    if(authorAcc.balance < amount || (authorAcc.balance - amount) < 0) {
      message.addReaction(config.emojis.cross.react);

      sendEmbed(message.channel,
        msgtypes.error,
        'Something went wrong',
        `You don't have enough ${currencyInfo.currency}`,
        message
      );
      return;
    }

    const targetAcc = await getAccount(target.id, message.guild.id);
    if(targetAcc instanceof Error) {
      message.addReaction(config.emojis.cross.react);
      sendEmbed(message.channel,
        msgtypes.error,
        'Something went wrong',
        'The transaction has failed, please try again',
        message);
      return;
    }

    if(targetAcc.frozen) {
      message.addReaction(config.emojis.cross.react);

      sendEmbed(message.channel,
        msgtypes.error,
        'Something went wrong',
        `The recipients account is frozen and cannot send or recieve ${currencyInfo.currency}`,
        message
      );
      return;
    }

    const db = (await database()).session;
    db.startTransaction();

    const removeBalance = await db
    .getSchema(message.guild.id)
    .getTable('user_accounts')
    .update()
    .where('user_id = :userid')
    .set('balance', authorAcc.balance - amount)
    .bind('userid', message.author.id)
    .execute()
    .catch((e) => e);

    if(removeBalance instanceof Error) {
      db.rollback();
      db.close();
      logger.log({ level: 'error', message: `Failed to remove balance for user ${message.author.id} in server: ${message.guild.id}`, removeBalance });

      message.addReaction(config.emojis.cross.react);
      sendEmbed(message.channel,
        config.msgtypes.error,
        'Something went wrong',
        `The transaction has failed, please try again`,
        message);
      return;
    }

    const addBalance = await db
    .getSchema(message.guild.id)
    .getTable('user_accounts')
    .update()
    .where('user_id = :userid')
    .set('balance', targetAcc.balance + amount)
    .bind('userid', target.id)
    .execute()
    .catch((e) => e);

    if(addBalance instanceof Error) {
      db.rollback();
      db.close();
      logger.log({ level: 'error', message: `Failed to add balance for user ${message.author.id} in server: ${message.guild.id}`, addBalance });

      message.addReaction(config.emojis.cross.react);
      sendEmbed(message.channel,
        config.msgtypes.error,
        'Something went wrong',
        `The transaction has failed, please try again`,
        message);
      return;
    }

    const uid = uuidv4().substr(0, 18).replace(/-/g, '');
    const addTrans = addTransaction(message.guild.id, uid, immersive.transaction_types.p2p, amount, message.author.id, target.id);

    if(addTrans instanceof Error) {
      db.rollback();
      db.close();
      logger.log({ level: 'error', message: `Failed to log transaction for server: ${message.guild.id}`, addTrans });

      message.addReaction(config.emojis.cross.react);
      sendEmbed(message.channel,
        config.msgtypes.error,
        'Something went wrong',
        `The transaction has failed, please try again`,
        message);
      return;
    }

    /** Commit queries */
    db.commit();
    db.close();

    message.addReaction(config.emojis.check.react);
    sendEmbed(message.channel,
      config.msgtypes.success,
      'Success',
      `<@${message.author.id}> has transferred ${currencyInfo.currency_symbol}**${amount}** to <@${target.id}>`,
      null,
      `Transaction ID: ${uid} | Requested by ${message.author.username}`,
      message.author.avatarURL,
      true,
      false);
  }
}

module.exports = new Send();
