const { database, logger } = require('../../config');
const createAccount = require('./createAccount');
const getAccount = require('./getAccount');
const BigNumber = require('bignumber.js');

module.exports = async function setBalance(userId, serverId, amount) {
  // Create account if not exists
  await createAccount(userId, serverId);

  const db = (await database()).session;

  const setBal = await db
      .getSchema(serverId)
      .getTable('user_accounts')
      .update()
      .where('user_id = :userid && frozen = 0')
      .set('balance', Number(amount))
      .bind('userid', userId)
      .execute()
      .catch((e) => e);

    console.log(setBal.getAffectedItemsCount())
  db.close();
  if(setBal instanceof Error) {
    logger.log({ level: 'error', message: `Failed to set balance for user ${userId} in server: ${serverId}`, setBal });
    return setBal;
  }

  return setBal;
}