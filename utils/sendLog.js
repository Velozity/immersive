const Chariot = require('chariot.js');
const Promise = require('bluebird');
const { discord } = require('../config');
const { getLogsChannel } = require('../services/guild');

/** Get DM channel id and send MSG to user */
module.exports = async function sendLog(serverId, type, title = '', description = '', footer = '', footerIcon = null, author = '', authorIcon = null) {
  const logChannelId = await getLogsChannel(serverId);
  if(logChannelId instanceof Error) {
    logger.log({ level: 'error', message: `Failed to get logs channel for server: ${serverId}`, logChannelId });
    return false;
  }

  if(logChannelId === null) return;

  const guild = discord.guilds.filter((guild) => guild.id === serverId)[0];
  if(guild === undefined) return;

  const logs = guild.channels.filter((channel) => channel.id === logChannelId)[0];
  if(logs === undefined) return;

  logs.createEmbed(new Chariot.RichEmbed()
    .setColor(type.color)
    .setTitle(title)
    .setDescription(description)
    .setFooter(footer, footerIcon)
    .setAuthor(author, authorIcon)
    .setTimestamp(new Date().toISOString())
  ).catch((e) => console.log('No log channel found'));
};
