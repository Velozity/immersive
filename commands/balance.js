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
const { sendEmbed, sendLog } = require('../utils');
const { getAccount, setBalance, addBalance, removeBalance, freezeBalance, unfreezeBalance } = require('../services/currency');
const { getPrefix, getLogsChannel, getStaffRole, getCurrency } = require('../services/guild');
const { discordHelper } = require('../helpers');
const { msgtypes } = require('../config/config');
const moment = require('moment')

/** Balance  */
class Balance extends Chariot.Command {
  constructor() {
    super();

    this.name = 'balance';
    this.allowDMs = false;
    this.cooldown = 2;
    this.aliases = ['bal']
    this.subcommands = ['freeze', 'unfreeze', 'set', 'add', 'remove']
    this.help = {
      message: 'Show your balance',
      usage: 'balance',
      example: ['balance'],
      visible: false
    };
  }

  async freeze(message, args, chariot) {
    if(!discordHelper.isAdminOrOwner(message))
      return;
      
    const target = message.mentions[0];
    if(target === undefined) {
      sendEmbed(message.channel,
        msgtypes.error,
        'Error',
        'You must specify a user to freeze their balance',
        message)
      return;
    }

    const freezeBal = await freezeBalance(target.id, message.guild.id);
    if(freezeBal instanceof Error) {
      sendEmbed(message.channel,
        msgtypes.error,
        'Error',
        'Something went wrong freezing this users balance',
        message)
        return;
    }

    if(!freezeBal) {
      sendEmbed(message.channel,
        msgtypes.error,
        'Error',
        `<@${target.id}>'s account is already frozen`,
        message)
        return;
    }

    sendLog(message.guild.id,
      msgtypes.general,
      `Account frozen`,
      `<@${target.id}>'s account has been frozen`,
      `Executed by ${message.author.username}#${message.author.discriminator}`);

    sendEmbed(message.channel,
      msgtypes.success,
      'Success',
      `<@${target.id}>'s account has been frozen`,
      message)
  }

  async unfreeze(message, args, chariot) {
    if(!discordHelper.isAdminOrOwner(message))
      return;

    const target = message.mentions[0];
    if(target === undefined) {
      sendEmbed(message.channel,
        msgtypes.error,
        'Error',
        'You must specify a user to unfreeze their balance',
        message)
      return;
    }

    const unfreezeBal = await unfreezeBalance(target.id, message.guild.id);
    if(unfreezeBal instanceof Error) {
      sendEmbed(message.channel,
        msgtypes.error,
        'Error',
        'Something went wrong freezing this users balance',
        message)
        return;
    }

    if(!unfreezeBal) {
      sendEmbed(message.channel,
        msgtypes.error,
        'Error',
        `<@${target.id}>'s account is already unfrozen`,
        message)
        return;
    }

    sendLog(message.guild.id,
      msgtypes.general,
      `Account unfrozen`,
      `<@${target.id}>'s account has been unfrozen`,
      `Executed by ${message.author.username}#${message.author.discriminator}`);
      
    sendEmbed(message.channel,
      msgtypes.success,
      'Success',
      `<@${target.id}>'s account has been unfrozen`,
      message)
  }

  async set(message, args, chariot) {
    if(!discordHelper.isAdminOrOwner(message))
      return;

    const target = message.mentions[0];
    const amount = args[1];

    if(target === undefined) {
      sendEmbed(message.channel,
        msgtypes.error,
        'Error',
        'You must specify a user to set their balance',
        message)
      return;
    }

    let reg = new RegExp('^[0-9]+$');
    if(!reg.test(amount)) {
      sendEmbed(message.channel,
        msgtypes.error,
        'Error',
        'You must specify a valid amount to set as their balance',
        message);
      return;
    }

    const oldBal = await getAccount(target.id, message.guild.id);
    const setBal = await setBalance(target.id, message.guild.id, amount);
    if(setBal instanceof Error) {
      sendEmbed(message.channel,
        msgtypes.error,
        'Error',
        'Failed to set this users balance',
        message);
      return;
    }

    const currencyInfo = await getCurrency(message.guild.id);

    sendLog(message.guild.id,
      msgtypes.general,
      `Account balance set`,
      `<@${target.id}>'s balance has been set to ${currencyInfo.currency_symbol}**${amount}** from ${currencyInfo.currency_symbol}**${oldBal.balance}**`,
      `Executed by ${message.author.username}#${message.author.discriminator}`);

    sendEmbed(message.channel,
      msgtypes.success,
      'Success',
      `<@${target.id}>'s balance has been set to ${currencyInfo.currency_symbol}**${amount}**`,
      message)
  }

  async add(message, args, chariot) {
    if(!discordHelper.isAdminOrOwner(message))
      return;
    const target = message.mentions[0];
    const amount = args[1];

    if(target === undefined) {
      sendEmbed(message.channel,
        msgtypes.error,
        'Error',
        'You must specify a user to add to their balance',
        message)
      return;
    }

    let reg = new RegExp('^[0-9]+$');
    if(!reg.test(amount)) {
      sendEmbed(message.channel,
        msgtypes.error,
        'Error',
        'You must specify a valid amount to add to their balance',
        message);
      return;
    }

    const addBal = await addBalance(target.id, message.guild.id, amount);
    if(addBal instanceof Error) {
      sendEmbed(message.channel,
        msgtypes.error,
        'Error',
        'Failed to add to this users balance',
        message);
      return;
    }

    const currencyInfo = await getCurrency(message.guild.id);

    sendLog(message.guild.id,
      msgtypes.general,
      `Account balance modified`,
      `${currencyInfo.currency_symbol}**${amount}** has been added to <@${target.id}>'s balance`,
      `Executed by ${message.author.username}#${message.author.discriminator}`);

    sendEmbed(message.channel,
      msgtypes.success,
      'Success',
      `${currencyInfo.currency_symbol}**${amount}** has been added to <@${target.id}>'s account`,
      message)
  }

  async remove(message, args, chariot) {
    if(!discordHelper.isAdminOrOwner(message))
      return;

    const target = message.mentions[0];
    const amount = args[1];

    if(target === undefined) {
      sendEmbed(message.channel,
        msgtypes.error,
        'Error',
        'You must specify a user to remove from their balance',
        message)
      return;
    }

    let reg = new RegExp('^[0-9]+$');
    if(!reg.test(amount)) {
      sendEmbed(message.channel,
        msgtypes.error,
        'Error',
        'You must specify a valid amount to remove from their balance',
        message);
      return;
    }

    const removeBal = await removeBalance(target.id, message.guild.id, amount);
    if(removeBal instanceof Error) {
      sendEmbed(message.channel,
        msgtypes.error,
        'Error',
        'Failed to remove from this users balance',
        message);
      return;
    }

    const currencyInfo = await getCurrency(message.guild.id);

    sendLog(message.guild.id,
      msgtypes.general,
      `Account balance modified`,
      `${currencyInfo.currency_symbol}**${amount}** has been deducted from <@${target.id}>'s balance`,
      `Executed by ${message.author.username}#${message.author.discriminator}`);

    sendEmbed(message.channel,
      msgtypes.success,
      'Success',
      `${currencyInfo.currency_symbol}**${amount}** has been deducted from <@${target.id}>'s account`,
      message)
  }

  async execute(message, args, chariot) {
    const target = message.mentions.length > 0 ? message.mentions[0] : message.author;

    if(target.bot) {
      sendEmbed(message.channel,
        msgtypes.error,
        'Something went wrong',
        'Bots do not have accounts',
        message);
      return;
    }

    const userAccount = await getAccount(target.id, message.guild.id);
    const currencyInfo = await getCurrency(message.guild.id);

    if(userAccount instanceof Error) {
      sendEmbed(message.channel,
        msgtypes.error,
        'Something went wrong',
        'There was a problem connecting to our servers, please try again',
        message);
      return;
    }

    message.channel.createEmbed(new Chariot.RichEmbed()
    .setColor(msgtypes.general.color)
    .setTitle(`${target.username}'s Wallet`)
    .setThumbnail(target.avatarURL)
    .addField(`${userAccount.frozen ? 'Account Status' : '__Balance__'}`, userAccount.frozen ? '❌ Frozen' : `${currencyInfo.currency_symbol}${userAccount.balance} ${currencyInfo.currency}`, false)
    .setFooter(`Requested by ${message.author.username}`, message.author.avatarURL)
    .setTimestamp(new Date().toISOString())
    );
  }
}

module.exports = new Balance();
