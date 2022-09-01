require('dotenv').config();
const { startDB } = require('./syrf-schema');
const redis = require('./externalServices/redis');
const { registerWorkers } = require('./jobs');

const createServer = require('./server');
const port = process.env.PORT || 3000;

(async () => {
  try {
    const app = createServer();

    await startDB();
    console.log(
      `Main database (${process.env.DB_NAME}) connected successfully`,
    );
    await redis.connect();
    await registerBGWorkers();

    if (process.env.ENABLE_DEBUG !== 'true') {
      console.time = () => {}; // To disable console time since it generates too many logs
      console.timeEnd = () => {};
    } else {
      console.log('Enabled debug mode. Logging console.time');
    }

    const serverStartLabel = 'Server start elapsed time';
    console.time(serverStartLabel);
    const server = app.listen(port, () => {
      console.log(`Server has started! Listening on ${port}`);
      console.timeEnd(serverStartLabel);
    });

    const shutDown = () => {
      console.log('Signal received! Closing...');
      // if (stompClient !== null) {
      //   stompClient.destroy();
      // }
      server.close(() => {
        console.log('Server has been closed!');
      });
    };
    process.on('SIGTERM', shutDown);
  } catch (error) {
    console.log(error);
  }
})();

const registerBGWorkers = async () => {
  try {
    registerWorkers({
      createClient: function (type, redisOpts) {
        switch (type) {
          case 'client':
            return redis.getBullClient();
          case 'subscriber':
            return redis.getBullSubscriber();
          case 'bclient':
            return redis.newConnection(redisOpts);
          default:
            throw new Error(`Unexpected connection type: ${type}`);
        }
      },
    });
    return 'register bg job workers success';
  } catch (err) {
    console.error(err);
    throw new Error(`register bg job workers failed : ${err.message}`);
  }
};
