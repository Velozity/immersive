const { database, logger } = require('../../config')

module.exports = async function getVoiceData(serverId) {
    const db = (await database()).session;

    const voice = await db
        .getSchema(process.env.DB_SCHEMA)
        .getTable('servers')
        .select(['voice_currency', 'voice_cooldown'])
        .where('guild_id = :guildid')
        .bind('guildid', serverId)
        .execute()
        .then((result) => result.fetchOne())
        .catch((e) => e);

    if(voice instanceof Error) {
      logger.log({ level: 'error', message: `Failed to get voice data for server: ${serverId}`, voice });
      return voice;
    }

    db.close();
    return {
      voice_currency: voice[0],
      voice_cd: voice[1]
    };
}