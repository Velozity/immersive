
const { redis } = require('../../config');
const getPerMsgData = require('../guild/getPerMsgData');
const getPrefix = require('../guild/getPrefix');
const getVoiceData = require('../guild/getVoiceData');

module.exports = async function cache(serverId) {
    // Get Data
    const prefix = await getPrefix(serverId);
    const perMsgData = await getPerMsgData(serverId);
    const voiceData = await getVoiceData(serverId);

    // Cache Prefix
    await redis.setAsync(`${serverId}_prefix`, prefix);
    
    // Cache per msg data
    await redis.setAsync(`${serverId}_permsgcurrency`, perMsgData.permsg_currency);
    await redis.setAsync(`${serverId}_permsgcooldown`, perMsgData.permsg_cd);
    await redis.setAsync(`${serverId}_permsgmultipliers`, JSON.stringify(perMsgData.permsg_multipliers));

    // Cache voice data
    await redis.setAsync(`${serverId}_voicecurrency`, voiceData.voice_currency);
    await redis.setAsync(`${serverId}_voicecooldown`, voiceData.voice_cd);
}