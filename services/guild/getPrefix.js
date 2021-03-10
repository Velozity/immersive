const { database, logger, redis } = require('../../config')

module.exports = async function getPrefix(serverId) {
    let prefix = await redis.getAsync(`${serverId}_prefix`);
    if(!prefix) {
        const db = (await database()).session;
        const getPrefix = await db
            .getSchema(process.env.DB_SCHEMA)
            .getTable('servers')
            .select('prefix')
            .where('guild_id = :guild_id')
            .bind('guild_id', serverId)
            .execute()
            .then((result) => result.fetchOne()[0])
            .catch((e) => e);

        db.close();
        if(getPrefix instanceof Error) {
            logger.log({ level: 'error', message: `Failed to get prefix`, getPrefix });
            return getPrefix;
        }

        await redis.setAsync(`${serverId}_prefix`, getPrefix);
        return getPrefix;
    }

    return prefix;
}