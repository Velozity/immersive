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
const { getCurrency } = require('../services/guild');
const { msgtypes } = require('../config/config');

/** Leaderboard  */
class Leaderboard extends Chariot.Command {
  constructor() {
    super();

    this.name = 'leaderboard';
    this.allowDMs = false;
    this.cooldown = 2;
    this.aliases = ['lb']
    this.help = {
      message: 'Display the leaderboard for your server',
      usage: 'leaderboard',
      example: 'leaderboard',
      visible: false
    };
  }

  async execute(message, args, chariot) {
    const currencyInfo = await getCurrency(message.guild.id);

    const db = (await database()).session;

    let getTopUsers = await db
        .getSchema(message.guild.id)
        .getTable('user_accounts')
        .select()
        .where('frozen = 0')
        .orderBy('balance DESC')
        .limit(10)
        .execute()
        .then((results) => results.fetchAll())
        .catch((e) => e);
  
    db.close();
    if(getTopUsers instanceof Error) {
      logger.log({ level: 'error', message: `Failed to get top users in server: ${serverId}`, addBal });
      return;
    }


    let embed = new Chariot.RichEmbed()
    .setColor(msgtypes.general.color)
    .setTitle(`${message.guild.name} Leaderboard`)
    .setAuthor('Immersive', discord.user.avatarURL, config.immersive.website_url)
    .setFooter(`Requested by ${message.author.username}`, message.author.avatarURL)
    .setTimestamp(new Date(Date.now()).toISOString());

    let count = 0;
    embed.setDescription(`🏆 __**${currencyInfo.currency} Leaderboard**__
${getTopUsers.map((u) => {
  count++;
  return `**${count}.** <@${u[0]}>  ${currencyInfo.currency_symbol}${u[1]}`;
}).join('\r\n')}`);

    message.channel.createEmbed(embed);
  }
}

module.exports = new Leaderboard();
