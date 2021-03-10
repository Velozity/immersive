const { database, logger } = require('../../config');
const createAccount = require('./createAccount');

module.exports = async function getBalance(userId, serverId) {
  // Create account if not exists
  await createAccount(userId, serverId);

  const db = (await database()).session;

  const balance = await db
      .getSchema(serverId)
      .getTable('user_accounts')
      .select(['balance', 'frozen', 'created_at'])
      .where('user_id = :userid')
      .bind('userid', userId)
      .execute()
      .then((result) => result.fetchOne())
      .catch((e) => e);

  db.close();
  if(balance instanceof Error || balance === undefined) {
    logger.log({ level: 'error', message: `Failed to get balance for user ${userId} in server: ${serverId}`, balance });
    return balance;
  }

  return { 
    balance: Number(balance[0]), 
    frozen: balance[1] === 1,
    created: balance[2]
  };
}