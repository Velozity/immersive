const { database, logger } = require('../../config');
const createAccount = require('./createAccount');
const getAccount = require('./getAccount');
const BigNumber = require('bignumber.js').BigNumber;

module.exports = async function addBalance(userId, serverId, amount) {
  const userAccount = await getAccount(userId, serverId);

  const db = (await database()).session;

  const addBal = await db
      .getSchema(serverId)
      .getTable('user_accounts')
      .update()
      .where('user_id = :userid && frozen = 0')
      .set('balance', new BigNumber(userAccount.balance).plus(amount).toString())
      .bind('userid', userId)
      .execute()
      .catch((e) => e);

  db.close();
  if(addBal instanceof Error) {
    logger.log({ level: 'error', message: `Failed to add balance for user ${userId} in server: ${serverId}`, addBal });
    return addBal;
  }

  return addBal;
}