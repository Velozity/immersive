const { config } = require('bluebird');
const { database, logger } = require('../../config');
const { immersive, msgtypes } = require('../../config/config');
const { getCurrency } = require('../guild');
const { sendLog } = require('../../utils');

module.exports = async function addTransaction(serverId, transId, type, amount, sender, receiver, extra = null) {
  const db = (await database()).session;

  const transaction = await db
      .getSchema(serverId)
      .getTable('logs_transactions')
      .insert(['id', 'type', 'amount', 'sender', 'receiver'])
      .values(transId, type, amount, sender, receiver)
      .execute()
      .catch((e) => e);

  db.close();
  if(transaction instanceof Error) {
    logger.log({ level: 'error', message: `Failed to add transaction log in server: ${serverId}`, transaction });
  }

  const currency = await getCurrency(serverId);

  switch(type) {
    case immersive.transaction_types.p2p:
      sendLog(serverId, 
        msgtypes.info,
        'Transaction completed',
        `<@${sender}> has transferred ${currency.currency_symbol}**${amount}** to <@${receiver}>`,
    `Transaction ID: ${transId}`);
      break;
    case immersive.transaction_types.drop:
      sendLog(serverId, 
        msgtypes.info,
        'Someone picked up a drop',
        `<@${receiver}> received a drop for ${currency.currency_symbol}**${amount}** ${currency.currency}`,
    extra);
      break;
  }

  return transaction;
}