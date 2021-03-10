const { database, logger, redis } = require('../../config');
const { cache } = require('../cache');
const getPerMsgData = require('./getPerMsgData');
const getPrefix = require('./getPrefix');
const getVoiceData = require('./getVoiceData');

module.exports = async function validateServer(serverId) {
  const serverExists = await redis.getAsync(`${serverId}_prefix`);

  if(!serverExists) {
    const db = (await database()).session;

    db.startTransaction();

    const createSchema = await db
      .createSchema(id)
      .then((schema) => schema.getSession())
      .then((session) => Promise
        .all([
          session.sql(`CREATE TABLE \`${id}\`.\`user_accounts\` (
            user_id BIGINT NOT NULL,
            balance BIGINT NOT NULL DEFAULT 0,
            frozen TINYINT NOT NULL DEFAULT 0,
            created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (user_id),
            UNIQUE INDEX user_id_UNIQUE (user_id ASC) VISIBLE);`)
            .execute(),
          session.sql(`CREATE TABLE \`${id}\`.\`logs_transactions\` (
            id varchar(20) NOT NULL,
            type varchar(80) NOT NULL,
            amount bigint NOT NULL,
            sender bigint NOT NULL,
            receiver bigint NULL,
            timestamp timestamp NULL DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (id),
            UNIQUE KEY id_UNIQUE (id)
          ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;`)
          .execute(),
          session.sql(`CREATE TABLE \`${id}\`.\`settings_permsg_ch_multipliers\` (
            ch_id bigint NOT NULL,
            multiplier int NOT NULL DEFAULT '0',
            PRIMARY KEY (ch_id),
            UNIQUE KEY ch_id_UNIQUE (ch_id)
          ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;`)
          .execute(),
          session.sql(`CREATE TABLE \`${id}\`.\`games_highlow\` (
            id VARCHAR(18) NOT NULL,
            p_id BIGINT NOT NULL,
            b_amount BIGINT NOT NULL,
            started TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            r_number INT NOT NULL,
            PRIMARY KEY (id),
            UNIQUE KEY p_id_UNIQUE (p_id)
            UNIQUE INDEX id_UNIQUE (id ASC) VISIBLE);
          `)
          .execute()
        ]))
      .catch((err) => err);

    if (createSchema instanceof Error) {
      db.rollback();
      db.close();
      logger.log({
        level: 'error', err: createSchema, message: 'Guild failed to be validated immersive.servers', guild: serverId,
      });
      return;
    }

    const addServer = await db
    .getSchema(process.env.DB_SCHEMA)
    .getSession(async (session) => await session.getSession())
    .sql(`INSERT IGNORE INTO \`${process.env.DB_SCHEMA}\`.\`servers\` (\`guild_id\`, \`prefix\`) VALUES ('${serverId}', '.');`)
    .execute()
    .catch((e) => e);

    if (addServer instanceof Error) {
      db.rollback();
      db.close();
      logger.log({
        level: 'error', err: addServer, message: 'Guild failed to be validated immersive.servers', guild: serverId,
      });
      return;
    }

    db.commit();
    db.close();

    cache(serverId);

    /** Send introductory message to the first text channel */
    const channel = channels.filter((ch) => ch.type === 0).find(x=>x!==undefined);
    if(typeof(channel) === undefined)
      return;

    sendEmbed(channel,
      config.msgtypes.info,
      'Welcome to Immersive',
      '[[ Detailed information goes here ]]');

    logger.log({ level: 'info', message: `New guild joined\nName:${name}\nMember(Count): ${memberCount}\nRegion: ${region}` });
  }
}