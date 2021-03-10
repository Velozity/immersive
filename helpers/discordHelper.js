const Chariot = require('chariot.js');
const { logger, database, discord, config } = require('../config');

function isOwner(message) {
    return message.guild.ownerID === message.author.id;
}

function isAdminOrOwner(message) {
    return message.guild.roles.filter((role) => message.member.roles.includes(role.id))
      .map((role) => role.json)
      .some((role) => role.administrator) || message.guild.ownerID === message.author.id;
}

module.exports = {
    isOwner,
    isAdminOrOwner,
}