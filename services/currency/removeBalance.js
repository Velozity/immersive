const { database, logger } = require('../../config');
const createAccount = require('./createAccount');
const getAccount = require('./getAccount');
const BigNumber = require('bignumber.js');

module.exports = async function removeBalance(userId, serverId, amount) {
  // Create account if not exists
  const userAccount = await getAccount(userId, serverId);

  if(Number(userAccount.balance) - Number(amount) < 0) {
    return false;
  }

  const db = (await database()).session;
  const removeBal = await db
      .getSchema(serverId)
      .getTable('user_accounts')
      .update()
      .where('user_id = :userid')
      .set('balance', Number(userAccount.balance) - Number(amount))
      .bind('userid', userId)
      .execute()
      .catch((e) => e);

  db.close();
  if(removeBal instanceof Error) {
    logger.log({ level: 'error', message: `Failed to remove balance for user ${userId} in server: ${serverId}`, removeBal });
    return removeBal;
  }

  return removeBal;
}