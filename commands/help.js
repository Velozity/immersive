const { database, config, discord } = require('../config');

/* eslint-disable class-methods-use-this */
const Chariot = require('chariot.js');
const { msgtypes } = require('../config/config');
const { isAdminOrOwner } = require('../helpers/discordHelper');
const { getPrefix, getCurrency }= require('../services/guild');
const bluebird = require('bluebird');
const { sendEmbed } = require('../utils');

class Help extends Chariot.Command {
  constructor() {
    super();

    this.name = 'help';
    this.allowDMs = true;
    this.subcommands = ['settings'];
    this.help = {
        message: 'Help command',
        usage: 'help [command]',
        example: ['help', 'help command'],
        inline: true
    }
  }

  async execute(message, args, chariot) {
    const isAdmin = isAdminOrOwner(message);
    const isOwner = message.guild.ownerID === message.author.id;
    const prefix = await getPrefix(message.guild.id);
    const currencyInfo = await getCurrency(message.guild.id);

    let embed = new Chariot.RichEmbed()
    .setColor(msgtypes.general.color)
    .setTitle(`Immersive Bot | Command Help`)
    .setAuthor('Immersive', discord.user.avatarURL, config.immersive.website_url)
    .setFooter(`Requested by ${message.author.username}`, message.author.avatarURL)
    .setTimestamp(new Date(Date.now()).toISOString());

    if(isAdmin) { 
      if(isOwner) {
        embed.setDescription(`You can manage all settings
[Modify settings in the server web panel](${config.immersive.website_server_web_panel})

**Inputs between <> are required, [] are optional**`)

        embed.addField('⚙️ **Bot Settings**', `\`\`${prefix}help settings\`\`\r\nView detailed instructions on modifying settings\r\n‏‏‎ ‎`, false)
      } else {
        embed.setDescription(`You can manage user accounts & shop related settings
[Modify settings in the server admin panel](${config.immersive.website_server_admin_web_panel})

**Inputs between <> are required, [] are optional**`)
      }

      embed.addField('🧍 **User Management**', `\`\`${prefix}balance set <@user> <amount>\`\`\r\nSets the users balance to the specified amount

\`\`${prefix}balance add <@user> <amount>\`\`\r\nAdd the specified amount to the users balance

\`\`${prefix}balance remove <@user> <amount>\`\`\r\nRemove the specified amount from the users balance

\`\`${prefix}balance freeze <@user>\`\`\r\nFreeze the users account (restrict access)

\`\`${prefix}balance unfreeze <@user>\`\`\r\nUnfreezes the users account`, true);

    }

      embed.addField('💰 **Currency Commands**', `\`\`${prefix}balance [@user]\`\`\r\nView your account balance\r\nAliases: **bal**

\`\`${prefix}send <amount> <@user>\`\`\r\nSend ${currencyInfo.currency} to the specified user

${isAdmin ? `\`\`${prefix}drop <amount> <max claims>\`\`\r\nDrop a specified amount of ${currencyInfo.currency} in chat that can only be claimed by a limited amount of users _(staff command)_` : ''}
`, true);


    message.channel.createEmbed(embed);
  }

  async settings(message, args, chariot) {
    const isOwner = message.guild.ownerID === message.author.id;
    const prefix = await getPrefix(message.guild.id);
    const currencyInfo = await getCurrency(message.guild.id);

    if(!isOwner) {
      sendEmbed(message.channel,
        msgtypes.error,
        'Error',
        'Only the server owner can see these immersive settings',
        message);
      return;
    }
    let embed = new Chariot.RichEmbed()
    .setColor(msgtypes.general.color)
    .setTitle(`Immersive Bot | Owner Settings Commands Help`)
    .setAuthor('Immersive', discord.user.avatarURL, config.immersive.website_url)
    .setFooter(`Requested by ${message.author.username}`, message.author.avatarURL)
    .setTimestamp(new Date(Date.now()).toISOString());

    embed.setDescription(`All of the commands below must start with: \`${prefix}settings\`

**Inputs between <> are required, [] are optional**`)

// ['prefix', 'symbol', 'currency', 'startbalance', 'startbal', 'logs', 'staffrole', 'chatpassive', 'voicepassive', 'chatcooldown', 'voicecooldown', 'blacklist', 'unblacklist']
    embed.addField('⚙️ **Bot Settings**', `\`\`${prefix}settings\`\`\r\nView all of the current settings
    
‎\`\`${prefix}settings prefix <prefix>\`\`\r\nUpdate the prefix users have to enter before commands

\`\`${prefix}settings logs <channel>\`\`\r\nChoose which channel for the bot to post logs

\`\`${prefix}settings staffrole <role>\`\`\r\nAssign a role to be able to modify staff immersive settings (remove bal, freeze etc)\r\n`, true)

    embed.addField('💰 **Currency Settings**', `\`\`${prefix}settings currency <new currency name>\`\`\r\nModify the name for the currency in your server
    
\`\`${prefix}settings symbol <emoji/text>\`\`\r\nModify your server currency symbol with an emoji or text (E.g: <:default_currency_symbol:782465136489267220> or $)

\`\`${prefix}settings startbalance <number>\`\`\r\nChoose how much currency users start with in your server\r\nAliases: **startbal**

\`\`${prefix}settings chatpassive <number>\`\`\r\nChoose how much currency users get for sending a message in your server

\`\`${prefix}settings chatcooldown <seconds>\`\`\r\nModify the cooldown in seconds between each message a user should get ${currencyInfo.currency}

\`\`${prefix}settings voicepassive <number>\`\`\r\nChoose how much ${currencyInfo.currency} users get for being in a voice chat

\`\`${prefix}settings voicecooldown <number>\`\`\r\nModify the cooldown in seconds for when a user gets ${currencyInfo.currency} for being in a voice chat

\`\`${prefix}settings blacklist <channel> [channel2] ...\`\`\r\nBlacklist a text channel from being able to receive passive ${currencyInfo.currency}

\`\`${prefix}settings unblacklist <channel> [channel2] ...\`\`\r\nUnblacklist a text channel`, true)

    message.channel.createEmbed(embed);
  }
}

module.exports = new Help();
