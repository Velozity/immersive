const { getCurrency, validateServer } = require('../guild');
const { database, logger } = require('../../config');
const { sendLog, sendEmbed } = require('../../utils');
const { msgtypes } = require('../../config/config');

module.exports = async function createAccount(userId, serverId) {
  const { currency_start_balance, currency, currency_symbol } = await getCurrency(serverId);
  
  const db = (await database()).session;

  const res = await db
  .getSchema(serverId)
  .getSession(async (session) => await session.getSession())
  .sql(`INSERT IGNORE INTO \`${serverId}\`.\`user_accounts\` (\`user_id\`, \`balance\`, \`frozen\`) VALUES ('${userId}', '${currency_start_balance}', '0');`)
  .execute()
  .then((res) => res.getAffectedItemsCount())
  .catch((e) => e);

  db.close();
  if(res instanceof Error) {
    logger.log({ level: 'error', message: `Failed to create account for user ${userId} in server: ${serverId}`, res });
    validateServer(serverId);

    return res;
  }

  return res;
}