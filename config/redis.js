/* eslint-disable no-console */
const redis = require('redis');
const bluebird = require('bluebird');
const logger = require('./winston');

/** Promisify redis with bluebird */
bluebird.promisifyAll(redis);


const client = redis.createClient({
  host: process.env.REDIS_IP,
  port: process.env.REDIS_PORT,
  password: process.env.REDIS_PW,
  db: 1,
});


client.on('ready', () => {
  console.log('Redis client is ready!');
});


client.on('connected', () => {
  console.log('Redis client is ready!');
});


client.on('error', (error) => {
  logger.log({ level: 'error', message: error });
});

client.on('warning', (warning) => {
  logger.log({ level: 'warn', message: warning });
});


module.exports = client;
