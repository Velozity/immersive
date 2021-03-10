const { database, logger } = require('../../config');
const createAccount = require('./createAccount');
const getAccount = require('./getAccount');
const BigNumber = require('bignumber.js');

module.exports = async function unfreezeBalance(userId, serverId) {
  const userAccount = await getAccount(userId, serverId);
  if(!userAccount.frozen) {
    return false;
  }

  const db = (await database()).session;

  const unfreezeBal = await db
      .getSchema(serverId)
      .getTable('user_accounts')
      .update()
      .where('user_id = :userid')
      .set('frozen', 0)
      .bind('userid', userId)
      .execute()
      .catch((e) => e);

  db.close();
  if(unfreezeBal instanceof Error) {
    freezeBal.log({ level: 'error', message: `Failed to unfreeze balance for user ${userId} in server: ${serverId}`, unfreezeBal });
    return unfreezeBal;
  }

  return unfreezeBal;
}