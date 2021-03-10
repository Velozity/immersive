/* eslint-disable class-methods-use-this */
const Chariot = require('chariot.js');
const shell = require('shelljs');
const { v4: uuidv4 } = require('uuid');
const { logger, database } = require('../config');

/**
 * Fired when a guild is deleted. This happens when:
 * - the client left the guild
 * - the client was kicked/banned from the guild
 * - the guild was literally deleted
 */
class GuildDelete extends Chariot.Event {
  /**
   * Instantiating the superclass with the appropriate event name
   */
  constructor() {
    super('guildDelete');
  }

  /**
   * @param {guild} Guild The guild
   */
  async execute(guild) {
    const {
      id, name, region, memberCount,
    } = guild;

    const db = (await database()).session;

    // /** Add dumping methods with shell to remove schema? */
    // const removeServer = await db
    //   .getSchema(process.env.DB_SCHEMA)
    //   .getTable('servers')
    //   .delete()
    //   .where('guild_id = :guild_id')
    //   .bind('guild_id', id)
    //   .execute()
    //   .catch((err) => err);

    // if (removeServer instanceof Error) {
    //   db.close();
    //   logger.log({
    //     level: 'error', err: dropSchema, message: 'Failed to remove guild on leave', guild: id,
    //   });
    // }

    /** Make session iddle */
    db.close();

    redis.del(`${id}_prefix`);
    redis.del(`${id}_permsgcurrency`);
    redis.del(`${id}_permsgcooldown`);
    redis.del(`${id}_permsgmultipliers`);
    redis.del(`${id}_voicecurrency`);
    redis.del(`${id}_voicecooldown`);
    redis.del(`${id}_voicemultipliers`);

    logger.log({ level: 'info', message: `Guild left\nName:${name}\nMember(Count): ${memberCount}\nRegion: ${region}` });
  }
}

module.exports = new GuildDelete();
