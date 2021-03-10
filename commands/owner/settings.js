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
  redis
} = require('../../config');
const { sendEmbed } = require('../../utils');
const { discordHelper } = require('../../helpers');
const { msgtypes } = require('../../config/config');
const { getPerMsgData, getVoiceData } = require('../../services/guild');

/** Settings  */
class Settings extends Chariot.Command {
  constructor() {
    super();

    this.name = 'settings';
    this.allowDMs = false;
    this.cooldown = 2;
    this.subcommands = ['prefix', 'symbol', 'currency', 'startbalance', 'startbal', 'logs', 'staffrole', 'chatpassive', 'voicepassive', 'chatcooldown', 'voicecooldown', 'blacklist', 'unblacklist']
    this.help = {
      message: 'Modify Immersive settings',
      usage: 'settings',
      example: ['settings'],
      visible: false
    };
  }

/**
  * Precondition testing method. This method will run BEFORE the main command logic.
  * Once every test passed, next() MUST be called, in order to run the main command logic!
  * @param {object} message An Eris.Message object emitted from Eris
  * @param {string[]} args An array containing all provided arguments
  * @param {object} chariot The main bot client.
  * @param {Function} next Marking testing as done, invoking the main command executor
  */
  async runPreconditions(message, args, chariot, next) {
    if(discordHelper.isOwner(message))
      next();
    else if(discordHelper.isAdminOrOwner(message))
      sendEmbed(message.channel,
        msgtypes.error,
        'Insufficient permissions',
        'Only the owner can modify Immersive settings',
        message)
  }

  async startbal(message, args, chariot) {
    this.startbalance(message, args, chariot);
  }

  async startbalance(message, args, chariot) {
    const startBalInput = args[0];
    let reg = new RegExp('^[0-9]+$');
    if(startBalInput === undefined || !reg.test(startBalInput)) {
      message.addReaction(config.emojis.cross.react);

      sendEmbed(message.channel,
        config.msgtypes.error,
        'Error',
        'Please supply a valid number',
        message);
      return;
    }

    const db = (await database()).session;

    const setStartBal = await db
        .getSchema(process.env.DB_SCHEMA)
        .getTable('servers')
        .update()
        .where('guild_id = :guild_id')
        .set('currency_start_balance', startBalInput)
        .bind('guild_id', message.guild.id)
        .execute()
        .catch((e) => e);

    db.close();
    if(setStartBal instanceof Error) {
      logger.log({ level: 'error', message: `Failed to set guild currency start balance for server: ${message.guild.id}`, setStartBal });

      message.addReaction(config.emojis.cross.react);
      sendEmbed(message.channel,
        config.msgtypes.error,
        'Error',
        `Something went wrong setting the starting balance to: \`\`${startBalInput}\`\``,
        message);
      return;
    }

    message.addReaction(config.emojis.check.react);

    sendEmbed(message.channel,
      config.msgtypes.success,
      'Success',
      `This servers starting balance has been set to: \`\`${startBalInput}\`\``,
      message);
  }

  async staffrole(message, args, chariot) {
    let role = message.roleMentions[0];
    const isNone = args.length > 0 ? args[0].toLowerCase() === 'none' : false;

    if(isNone) role = 'None';

    if(role === undefined) {
      message.addReaction(config.emojis.cross.react);
      sendEmbed(message.channel,
        config.msgtypes.error,
        'Error',
        'Please supply a mentioned role',
        message);
      return;
    }

    const db = (await database()).session;

    const setStaffRole = await db
        .getSchema(process.env.DB_SCHEMA)
        .getTable('servers')
        .update()
        .where('guild_id = :guild_id')
        .set('role_staff', role === 'None' ? null : role)
        .bind('guild_id', message.guild.id)
        .execute()
        .catch((e) => e);

    db.close();
    if(setStaffRole instanceof Error) {
      logger.log({ level: 'error', message: `Failed to set staff role for server: ${message.guild.id}`, setStaffRole });

      message.addReaction(config.emojis.cross.react);
      sendEmbed(message.channel,
        config.msgtypes.error,
        'Error',
        `Something went wrong setting the staff role to: \`\`${role}\`\``,
        message);
      return;
    }

    message.addReaction(config.emojis.check.react);
    sendEmbed(message.channel,
      config.msgtypes.success,
      'Success',
      `This servers staff role has been set to: ${role === 'None' ? '``None``' : `<@&${role}>`}`,
      message);
  }

  async logs(message, args, chariot) {
    let logsChannel = message.channelMentions[0];
    const isNone = args.length > 0 ? args[0].toLowerCase() === 'none' : false;

    if(isNone) logsChannel = 'None';

    if(logsChannel === undefined) {
      message.addReaction(config.emojis.cross.react);
      sendEmbed(message.channel,
        config.msgtypes.error,
        'Error',
        'Please supply a mentioned channel',
        message);
      return;
    }

    const db = (await database()).session;

    const setLogsChannel = await db
        .getSchema(process.env.DB_SCHEMA)
        .getTable('servers')
        .update()
        .where('guild_id = :guild_id')
        .set('ch_logs', logsChannel === 'None' ? null : logsChannel)
        .bind('guild_id', message.guild.id)
        .execute()
        .catch((e) => e);

    db.close();
    if(setLogsChannel instanceof Error) {
      logger.log({ level: 'error', message: `Failed to set logs channel for server: ${message.guild.id}`, setLogsChannel });

      message.addReaction(config.emojis.cross.react);
      sendEmbed(message.channel,
        config.msgtypes.error,
        'Error',
        `Something went wrong setting the logs channel to: \`\`${logsChannel}\`\``,
        message);
      return;
    }

    message.addReaction(config.emojis.check.react);
    sendEmbed(message.channel,
      config.msgtypes.success,
      'Success',
      `This servers logs channel has been set to: ${logsChannel === 'None' ? '``None``' : `<#${logsChannel}>`}`,
      message);
  }

  async currency(message, args, chariot) {
    const currency = args.join(' ');

    if(currency === undefined || currency === '' || currency.length >= 45) {
      message.addReaction(config.emojis.cross.react);
      sendEmbed(message.channel,
        config.msgtypes.error,
        'Error',
        'Please supply a valid currency (below 45 characters)',
        message);
      return;
    }

    const db = (await database()).session;

    const setCurrency = await db
        .getSchema(process.env.DB_SCHEMA)
        .getTable('servers')
        .update()
        .where('guild_id = :guild_id')
        .set('currency', currency)
        .bind('guild_id', message.guild.id)
        .execute()
        .catch((e) => e);

    db.close();
    if(setCurrency instanceof Error) {
      logger.log({ level: 'error', message: `Failed to set guild currency for server: ${message.guild.id}`, setCurrency });

      message.addReaction(config.emojis.cross.react);
      sendEmbed(message.channel,
        config.msgtypes.error,
        'Error',
        `Something went wrong setting the currency to: \`\`${currency}\`\``,
        message);
      return;
    }

    message.addReaction(config.emojis.check.react);
    sendEmbed(message.channel,
      config.msgtypes.success,
      'Success',
      `This servers currency has been set to: \`\`${currency}\`\``,
      message);
  }

  async symbol(message, args, chariot) {
    const symbol = args.join(' ');

    if(symbol === undefined || symbol === '' || symbol.length >= 200) {
      message.addReaction(config.emojis.cross.react);
      sendEmbed(message.channel,
        config.msgtypes.error,
        'Error',
        'Please supply a valid symbol (below 200 characters)',
        message);
      return;
    }

    const db = (await database()).session;

    const setSymbol = await db
        .getSchema(process.env.DB_SCHEMA)
        .getTable('servers')
        .update()
        .where('guild_id = :guild_id')
        .set('currency_symbol', symbol)
        .bind('guild_id', message.guild.id)
        .execute()
        .catch((e) => e);

    db.close();
    if(setSymbol instanceof Error) {
      logger.log({ level: 'error', message: `Failed to set guild symbol for server: ${message.guild.id}`, setSymbol });

      message.addReaction(config.emojis.cross.react);
      sendEmbed(message.channel,
        config.msgtypes.error,
        'Error',
        `Something went wrong setting the currency symbol to: \`\`${symbol}\`\``,
        message);
      return;
    }

    message.addReaction(config.emojis.check.react);
    sendEmbed(message.channel,
      config.msgtypes.success,
      'Success',
      `This servers currency symbol has been set to: ${symbol}`,
      message);
  } 

  async prefix(message, args, chariot) {
    const prefix = args.join(' ');

    if(prefix === undefined || prefix === '' || prefix.length >= 20) {
      message.addReaction(config.emojis.cross.react);

      sendEmbed(message.channel,
        config.msgtypes.error,
        'Error',
        'Please supply a valid prefix (below 20 characters)',
        message);
      return;
    }

    const db = (await database()).session;

    const setPrefix = await db
        .getSchema(process.env.DB_SCHEMA)
        .getTable('servers')
        .update()
        .where('guild_id = :guild_id')
        .set('prefix', prefix)
        .bind('guild_id', message.guild.id)
        .execute()
        .catch((e) => e);

    db.close();
    if(setPrefix instanceof Error) {
      logger.log({ level: 'error', message: `Failed to set guild prefix for server: ${message.guild.id}`, setPrefix });

      message.addReaction(config.emojis.cross.react);
      sendEmbed(message.channel,
        config.msgtypes.error,
        'Error',
        `Something went wrong setting the prefix: \`\`${prefix}\`\``,
        message);
      return;
    }

    await redis.setAsync(`${serverId}_prefix`, prefix);

    message.addReaction(config.emojis.check.react);
    sendEmbed(message.channel,
      config.msgtypes.success,
      'Success',
      `This servers prefix has been set to: \`\`${prefix}\`\``,
      message);
  }
  
  async chatpassive(message, args, chariot) {
    const passivePoints = args[0];
    let reg = new RegExp('^[0-9]+$');
    if(passivePoints === undefined || !reg.test(passivePoints)) {
      message.addReaction(config.emojis.cross.react);

      sendEmbed(message.channel,
        config.msgtypes.error,
        'Error',
        'Please supply a valid number of currency to give users for talking in chat',
        message);
      return;
    }

    const db = (await database()).session;

    const setPassiveCurrency = await db
        .getSchema(process.env.DB_SCHEMA)
        .getTable('servers')
        .update()
        .where('guild_id = :guild_id')
        .set('permsg_currency', passivePoints)
        .bind('guild_id', message.guild.id)
        .execute()
        .catch((e) => e);

    db.close();
    if(setPassiveCurrency instanceof Error) {
      logger.log({ level: 'error', message: `Failed to set guild passive currency for server: ${message.guild.id}`, setPassiveCurrency });

      message.addReaction(config.emojis.cross.react);
      sendEmbed(message.channel,
        config.msgtypes.error,
        'Error',
        `Something went wrong setting the currency per msg chat points to: \`\`${passivePoints}\`\``,
        message);
      return;
    }

    await redis.setAsync(`${message.guild.id}_permsgcurrency`, passivePoints);

    message.addReaction(config.emojis.check.react);
    sendEmbed(message.channel,
      config.msgtypes.success,
      'Success',
      `This servers currency per msg chat currency has been set to: \`\`${passivePoints}\`\``,
      message);
  }

  async voicepassive(message, args, chariot) {
    const passivePoints = args[0];
    let reg = new RegExp('^[0-9]+$');
    if(passivePoints === undefined || !reg.test(passivePoints)) {
      message.addReaction(config.emojis.cross.react);
      sendEmbed(message.channel,
        config.msgtypes.error,
        'Error',
        'Please supply a valid number of currency to give users for being in voice chat',
        message);
      return;
    }

    const db = (await database()).session;

    const setPassiveCurrency = await db
        .getSchema(process.env.DB_SCHEMA)
        .getTable('servers')
        .update()
        .where('guild_id = :guild_id')
        .set('voice_currency', passivePoints)
        .bind('guild_id', message.guild.id)
        .execute()
        .catch((e) => e);

    db.close();
    if(setPassiveCurrency instanceof Error) {
      logger.log({ level: 'error', message: `Failed to set guild passive voice currency for server: ${message.guild.id}`, setPassiveCurrency });

      message.addReaction(config.emojis.cross.react);
      sendEmbed(message.channel,
        config.msgtypes.error,
        'Error',
        `Something went wrong setting the passive voice points to: \`\`${passivePoints}\`\``,
        message);
      return;
    }

    await redis.setAsync(`${message.channel.guild.id}_voicecurrency`, passivePoints);

    message.addReaction(config.emojis.check.react);
    sendEmbed(message.channel,
      config.msgtypes.success,
      'Success',
      `This servers passive voice chat currency has been set to: \`\`${passivePoints}\`\``,
      message);
  }

  async chatcooldown(message, args, chariot) {
    const cooldown = args[0];
    let reg = new RegExp('^[0-9]+$');
    if(cooldown === undefined || !reg.test(cooldown)) {
      message.addReaction(config.emojis.cross.react);

      sendEmbed(message.channel,
        config.msgtypes.error,
        'Error',
        'Please supply a valid number in seconds for the cooldown of points to be given per message',
        message);
      return;
    }

    const db = (await database()).session;

    const setMsgCooldown = await db
        .getSchema(process.env.DB_SCHEMA)
        .getTable('servers')
        .update()
        .where('guild_id = :guild_id')
        .set('permsg_cooldown', cooldown)
        .bind('guild_id', message.guild.id)
        .execute()
        .catch((e) => e);

    db.close();
    if(setMsgCooldown instanceof Error) {
      logger.log({ level: 'error', message: `Failed to set per msg cooldown for server: ${message.guild.id}`, setMsgCooldown });

      message.addReaction(config.emojis.cross.react);
      sendEmbed(message.channel,
        config.msgtypes.error,
        'Error',
        `Something went wrong setting the currency per msg cooldown to: \`\`${cooldown}\`\` seconds`,
        message);
      return;
    }

    await redis.setAsync(`${message.guild.id}_permsgcooldown`, cooldown);

    message.addReaction(config.emojis.check.react);
    sendEmbed(message.channel,
      config.msgtypes.success,
      'Success',
      `This servers per currency msg cooldown has been set to: \`\`${cooldown}\`\` seconds`,
      message);
  }

  async voicecooldown(message, args, chariot) {
    const cooldown = args[0];
    let reg = new RegExp('^[0-9]+$');
    if(cooldown === undefined || !reg.test(cooldown)) {
      message.addReaction(config.emojis.cross.react);

      sendEmbed(message.channel,
        config.msgtypes.error,
        'Error',
        'Please supply a valid number in seconds for the cooldown of points to be given in a voice chat',
        message);
      return;
    }

    const db = (await database()).session;

    const setVoiceCooldown = await db
        .getSchema(process.env.DB_SCHEMA)
        .getTable('servers')
        .update()
        .where('guild_id = :guild_id')
        .set('voice_cooldown', cooldown)
        .bind('guild_id', message.guild.id)
        .execute()
        .catch((e) => e);

    db.close();
    if(setVoiceCooldown instanceof Error) {
      logger.log({ level: 'error', message: `Failed to set per msg cooldown for server: ${message.guild.id}`, setVoiceCooldown });

      message.addReaction(config.emojis.cross.react);
      sendEmbed(message.channel,
        config.msgtypes.error,
        'Error',
        `Something went wrong setting the voice chat points cooldown to: \`\`${cooldown}\`\` seconds`,
        message);
      return;
    }

    await redis.setAsync(`${message.guild.id}_voicecooldown`, cooldown);

    message.addReaction(config.emojis.check.react);
    sendEmbed(message.channel,
      config.msgtypes.success,
      'Success',
      `This servers voice chat points cooldown has been set to: \`\`${cooldown}\`\` seconds`,
      message);
  }

  async blacklist(message, args, chariot) {
    const guildTextChannels = message.guild.channels.filter((ch) => ch.type === 0).map((ch) => ch.id);

    const currentTextBlacklisted = (await getPerMsgData(message.guild.id)).permsg_multipliers;

    let textChannels = message.channelMentions.filter((ch) => guildTextChannels.includes(ch));

    if(currentTextBlacklisted.map((bl) => bl[0]).some(r => textChannels.includes(r))) {
      message.addReaction(config.emojis.cross.react);

      sendEmbed(message.channel,
        config.msgtypes.error,
        'Error',
        'One of the channels supplied are already blacklisted',
        message);
      return;
    }

    if(textChannels.length === 0) {
      message.addReaction(config.emojis.cross.react);

      sendEmbed(message.channel,
        config.msgtypes.error,
        'Error',
        'Please supply a channel or channels to blacklist users from earning currency in',
        message);
      return;
    }

    const db = (await database()).session;

    const addBlacklistedTextChannels = await db
    .sql(`INSERT INTO \`${message.guild.id}\`.settings_permsg_ch_multipliers
    (ch_id, multiplier)
    VALUES ${textChannels.map((ch) => `('${ch}', '0')`).join(',')}`)
    .execute()
    .then((results) => results.getAffectedItemsCount())
    .catch((e) => e); 

    if (addBlacklistedTextChannels instanceof Error) {
      db.close();
      logger.log({
        level: 'error', err: addBlacklistedTextChannels, message: 'Failed to add blacklisted channel', guild: message.guild.id
      });

      message.addReaction(config.emojis.cross.react);
      sendEmbed(message.channel,
        config.msgtypes.error,
        'Error',
        `We were unable to update your blacklisted channels, please try again`,
        message)
      return;
    }
  

    message.addReaction(config.emojis.check.react);
    sendEmbed(message.channel,
      config.msgtypes.success,
      'Success',
      `The following channels have been blacklisted from earning currency per msg:\r\n${textChannels.map((ch) => `<#${ch}>`).join('\r\n')}`,
      message);
  }

  async unblacklist(message, args, chariot) {
    const guildTextChannels = message.guild.channels.filter((ch) => ch.type === 0).map((ch) => ch.id);
    const currentTextBlacklisted = (await getPerMsgData(message.guild.id)).permsg_multipliers;

    let textChannels = message.channelMentions.filter((ch) => guildTextChannels.includes(ch));

    if(!currentTextBlacklisted.map((bl) => bl[0]).some(r => textChannels.includes(r))) {
      message.addReaction(config.emojis.cross.react);

      sendEmbed(message.channel,
        config.msgtypes.error,
        'Error',
        'One of the channels supplied are not blacklisted',
        message);
      return;
    }

    if(textChannels.length === 0) {
      message.addReaction(config.emojis.cross.react);
      sendEmbed(message.channel,
        config.msgtypes.error,
        'Error',
        'Please supply a channel or channels to blacklist users from earning currency in',
        message);
      return;
    }

    const db = (await database()).session;

    const unblacklistTextChannels = await db
    .sql(`DELETE FROM\`${message.guild.id}\`.settings_permsg_ch_multipliers
    WHERE (${textChannels.map((ch) => `ch_id = '${ch}'`).join(' OR ')})`)
    .execute()
    .then((results) => results.getAffectedItemsCount())
    .catch((e) => e); 

    if (unblacklistTextChannels instanceof Error) {
      db.close();
      logger.log({
        level: 'error', err: unblacklistTextChannels, message: 'Failed to unblacklist text channels', guild: message.guild.id
      });

      message.addReaction(config.emojis.cross.react);
      sendEmbed(message.channel,
        config.msgtypes.error,
        'Error',
        `We were unable to update your unblacklisted channels, please try again`,
        message)
      return;
    }

    message.addReaction(config.emojis.check.react);
    sendEmbed(message.channel,
      config.msgtypes.success,
      'Success',
      `The following channels have been unblacklisted for earning currency per msg:\r\n${textChannels.map((ch) => `<#${ch}>`).join('\r\n')}`,
      message);
  }

  /**
      * Main method running after passing preconditions
      * @param {object} message An Eris.Message object emitted from Eris
      * @param {string[]} args An array containing all provided arguments
      * @param {object} chariot The main bot client.
      */
  async execute(message, args, chariot) {
    const db = (await database()).session;

    const settingsInfo = await db
    .getSchema(process.env.DB_SCHEMA)
    .getTable('servers')
    .select(['prefix', 'ch_logs', 'role_staff', 'currency', 'currency_symbol', 'currency_start_balance', 'permsg_currency', 'permsg_cooldown', 'voice_currency', 'voice_cooldown'])
    .where('guild_id = :guildid')
    .bind('guildid', message.guild.id)
    .execute()
    .then((result) => result.fetchOne())
    .catch((e) => e);

    if(settingsInfo instanceof Error) {
      logger.log({ level: 'error', message: `Failed to get settings data for server: ${message.guild.id}`, settingsInfo });

      message.addReaction(config.emojis.cross.react);
      sendEmbed(message.channel, 
        msgtypes.error,
        'Error',
        'Failed to retrieve settings',
        message);
      return settingsInfo;
    }

    const prefix = settingsInfo[0],
          logsChannel = settingsInfo[1],
          staffRole = settingsInfo[2],
          currency = settingsInfo[3],
          currencySymbol = settingsInfo[4],
          currencyStartBalance = settingsInfo[5],
          permsgCurrency = settingsInfo[6],
          permsgCooldown = settingsInfo[7],
          voiceCurrency = settingsInfo[8],
          voiceCooldown = settingsInfo[9];

    message.channel.createEmbed(new Chariot.RichEmbed()
    .setColor(config.colors.primary)
    .setAuthor('Immersive', discord.user.avatarURL, config.immersive.website_url)
    .setTitle(`${message.guild.name} Settings`)
    .setDescription(`View & manage your settings — \`\`${prefix}help settings\`\`
[Modify in server owner web panel](${config.immersive.website_server_web_panel})‎\r\n‏‏‎ ‎`)
    .addField('**Server Settings**\r\n__Prefix__', prefix, true)
    .addField(' ‎\r\n__Logs Channel__', logsChannel === null ? 'None' : `<#${logsChannel}>`, true)
    .addBlankField(true)
    .addBlankField(false)
    .addField('**Currency Settings**\r\n__Currency Name__', currency === null ? 'None' : currency, true)
    .addField('‏‏‎ ‎\r\n__Currency Symbol__', currencySymbol === null ? 'None' : currencySymbol, true)
    .addField(`‏‏‎ ‎\r\n__Starting Balance__`, `${currencyStartBalance} ${currency}`, true)
    .addField(`__${currency} Per Msg__`, permsgCurrency === undefined || Number(permsgCurrency) === 0 ? 'None' : permsgCurrency, true)
    .addField('__Message Cooldown__', permsgCooldown + ' seconds', true)
    .addField(`__${currency} Per CD in VC__`, voiceCurrency, true)
    .addField('__Voice Chat Cooldown__', voiceCooldown + ' seconds', true)
    .addBlankField(false)
    .addField('Passive Currency Summary', `_When a user sends a message, they will get ${permsgCurrency} ${currency} with a ${permsgCooldown} second cooldown._
_When a user is in a voice chat, they will get ${voiceCurrency} ${currency} every ${voiceCooldown} seconds._`, false)
    );

    message.addReaction(config.emojis.check.react);
  }
}

module.exports = new Settings();
