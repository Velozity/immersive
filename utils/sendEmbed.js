const Chariot = require('chariot.js');
const { config, discord } = require('../config');

/** Creates an embed and sends it to the provided channel */
module.exports = async function sendEmbed(channel, type, title, description, message = null, footer = '', footerIcon = null, timestamp = true, showAuthor = false, thumbnail = null) {
  if(message) {
    footer = `Requested by ${message.author.username}`;
    footerIcon = message.author.avatarURL;
  }
  
  const embed = new Chariot.RichEmbed()
  .setColor(type.color)
  .setTitle(title)
  .setDescription(description)
  .setThumbnail(thumbnail)
  .setFooter(footer, footerIcon)
  .setTimestamp(timestamp ? new Date().toISOString() : null);
  
  console.log(embed)
  if(showAuthor) embed.setAuthor('Immersive', discord.user.avatarURL, config.immersive.website_url);

  return channel.createEmbed(embed);
};