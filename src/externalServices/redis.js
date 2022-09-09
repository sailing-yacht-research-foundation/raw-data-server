const Redis = require('ioredis');
/**
 * @typedef {import('ioredis').Redis} Redis
 */

/**
 * @type {Redis}
 */
let cacheClient = null;
let bullClient = null;
let bullSubscriber = null;

let opt = {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
  port: parseInt(process.env.REDIS_PORT || 6379),
};

if (process.env.REDIS_PASSWORD) opt.password = process.env.REDIS_PASSWORD;

exports.connect = () =>
  new Promise((resolve, reject) => {
    if (!process.env.REDIS_HOST) {
      console.log(
        'No redis host in environment variable. Opengraph generation will be skipped',
      );
      return resolve();
    }
    bullClient = new Redis(process.env.REDIS_HOST, opt);
    bullSubscriber = new Redis(process.env.REDIS_HOST, opt);
    cacheClient = new Redis(process.env.REDIS_HOST, opt);

    const timeout = setTimeout(() => {
      console.log(
        'redis create connection is taking too long, skip waiting for redis connection',
      );
      return resolve();
    }, 5000);

    bullClient.ping((err) => {
      if (err) {
        console.log('redis connection failed', err);
        return reject(err);
      }

      console.log(
        'redis connection created to',
        process.env.REDIS_HOST,
        opt.port,
      );
      clearTimeout(timeout);
      return resolve();
    });
  });

exports.newConnection = (redisOpts) => {
  return new Redis(process.env.REDIS_HOST, { ...opt, redisOpts });
};

exports.getBullClient = () => bullClient;
exports.getBullSubscriber = () => bullSubscriber;
exports.getCache = () => cacheClient;
