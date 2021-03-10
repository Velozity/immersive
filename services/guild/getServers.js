const { database, logger } = require('../../config')

module.exports = async function getServers(search = null) {
    const db = (await database()).session;

    const servers = await db
        .getSchema(process.env.DB_SCHEMA)
        .getTable('servers')
        .select('guild_id')
        .where(search)
        .execute()
        .then((result) => result.fetchAll().map((r) => r[0]))
        .catch((e) => e);

    db.close();
    if(servers instanceof Error) {
      logger.log({ level: 'error', message: `Failed to get servers`, servers });
      return servers;
    }

    return servers;
}