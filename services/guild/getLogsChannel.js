const { database, logger } = require('../../config')

module.exports = async function getLogsChannel(serverId) {
    const db = (await database()).session;

    const getLogsCh = await db
        .getSchema(process.env.DB_SCHEMA)
        .getTable('servers')
        .select('ch_logs')
        .where('guild_id = :guildid')
        .bind('guildid', serverId)
        .execute()
        .then((result) => result.fetchOne()[0])
        .catch((e) => e);

    db.close();
    if(getLogsCh instanceof Error) {
      logger.log({ level: 'error', message: `Failed to get logs channel for server: ${serverId}`, getLogsCh });
      return getLogsCh;
    }

    return getLogsCh;
}