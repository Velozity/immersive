/* eslint-disable func-names */
const mysqlx = require('@mysql/xdevapi');

const client = mysqlx.getClient({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
}, {
  pooling: {
    enabled: true,
    maxSize: 100,
    maxIdleTime: 5,
    queueTimeout: 30000,
  },
});

module.exports = async () => ({
  session: await client.getSession(),
});
