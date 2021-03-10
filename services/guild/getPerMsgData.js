const { database, logger } = require('../../config')

module.exports = async function getPerMsgData(serverId) {
    const db = (await database()).session;

    const perMsg = await db
        .getSchema(process.env.DB_SCHEMA)
        .getTable('servers')
        .select(['permsg_currency', 'permsg_cooldown'])
        .where('guild_id = :guildid')
        .bind('guildid', serverId)
        .execute()
        .then((result) => result.fetchOne())
        .catch((e) => e);

    if(perMsg instanceof Error) {
      logger.log({ level: 'error', message: `Failed to get permsg data for server: ${serverId}`, perMsg });
      return perMsg;
    }

    const multipliers = await db
    .getSchema(serverId)
    .getTable('settings_permsg_ch_multipliers')
    .select()
    .execute()
    .then((result) => result.fetchAll())
    .catch((e) => e);

  if(multipliers instanceof Error) {
    logger.log({ level: 'error', message: `Failed to get multiplyer data for server: ${serverId}`, multipliers });
    return multipliers;
  }

    db.close();
    return {
      permsg_currency: perMsg[0],
      permsg_cd: perMsg[1],
      permsg_multipliers: multipliers
    };
}