/* eslint-disable class-methods-use-this */
const Chariot = require('chariot.js');
const { discord } = require('../config');
const { getServers } = require('../services/guild');
const guildCreate = require('./guildCreate');
const { cache } = require('../services/cache');

/* Fired when all shards turn ready */
class Ready extends Chariot.Event {
  /**
   * Instantiating the superclass with the appropriate event name
   */
  constructor() {
    super('ready');
  }

  /**
   * @param {error} err Error
   * @param {number} id ID of the shard
   */
  async execute() {
    Chariot.Logger.success('IMMERSIVE STARTUP', 'Caching server data');

  /**
    * Load currency timer settings from sql 
    */

    const registeredServers = await getServers();
    const unregisteredServers = discord.guilds.filter((g) => !registeredServers.includes(g.id));

    if(unregisteredServers.length > 0) {
      Chariot.Logger.success('IMMERSIVE STARTUP', 'Unregistered servers detected, fixing the issue');

      unregisteredServers.forEach((guild) => {
        guildCreate.execute(guild);
      });
 
      Chariot.Logger.success('IMMERSIVE STARTUP', `Cached ${registeredServers.length} servers`);
    
      Chariot.Logger.success('IMMERSIVE STARTUP', 'Ready!');
      return;
    }

    for(let i = 0; i < registeredServers.length; i++) {
      const serverId = registeredServers[i];
      await cache(serverId);
    }

    Chariot.Logger.success('IMMERSIVE STARTUP', `Cached ${registeredServers.length} servers`);
    
    Chariot.Logger.success('IMMERSIVE STARTUP', 'Ready!');
  }
}

module.exports = new Ready();
