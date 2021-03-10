/* eslint-disable global-require */

module.exports = {
  config: require('./config'), // MUST HAVE A DIFFERENT PRODUCTION CONFIG
  logger: require('./winston'),
  discord: require('./discord'),
  database: require('./database'),
  redis: require('./redis'),
};
