const { database, logger } = require('../../config')

module.exports = async function getCurrency(serverId) {
    const db = (await database()).session;

    const getCurrencyInfo = await db
        .getSchema(process.env.DB_SCHEMA)
        .getTable('servers')
        .select(['currency', 'currency_symbol', 'currency_start_balance'])
        .where('guild_id = :guildid')
        .bind('guildid', serverId)
        .execute()
        .then((result) => result.fetchOne())
        .catch((e) => e);

    db.close();
    if(getCurrencyInfo instanceof Error) {
      logger.log({ level: 'error', message: `Failed to get currency info for server: ${serverId}`, getCurrencyInfo });
      return getCurrencyInfo;
    }

    return { 
      currency: getCurrencyInfo[0], 
      currency_symbol: getCurrencyInfo[1], 
      currency_start_balance: getCurrencyInfo[2] 
    };
}