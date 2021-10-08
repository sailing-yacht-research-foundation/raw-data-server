require('dotenv').config();
const db = require('./models');
const createMQSubscriber = require('./subscribers/createMQSubscriber');
const { dataPointSubscriberAction } = require('./subscribers/dataPoint');
const { startDB } = require('./syrf-schema');

const createServer = require('./server');
const port = process.env.PORT || 3000;
const mqHost = process.env.MQ_HOST;
const mqPort = process.env.MQ_PORT || 61613;
const mqUser = process.env.MQ_USER || 'guest';
const mqPassword = process.env.MQ_PASSWORD || 'guest';
const mqTimeout = Number(process.env.MQ_TIMEOUT) || 2700000;
const mqTopic = process.env.MQ_TOPIC || '/topic/rawdata.topic';

(async () => {
  try {
    const app = createServer();

    console.log('Migrating raw data server');
    await db.sequelize.sync();

    await startDB();
    console.log(
      `Main database (${process.env.DB_NAME}) connected successfully`,
    );

    const onConnect = () => {
      console.log('MQ connected successfully');
    };
    const subscriptions = [
      {
        topic: mqTopic,
        action: dataPointSubscriberAction,
      },
    ];
    const stompClient = mqHost
      ? createMQSubscriber(
          { mqHost, mqPort, mqUser, mqPassword, mqTimeout },
          onConnect,
          subscriptions,
        )
      : null;

    const server = app.listen(port, () => {
      console.log(`Server has started! Listening on ${port}`);
    });

    const shutDown = () => {
      console.log('Signal received! Closing...');
      if (stompClient !== null) {
        stompClient.destroy();
      }
      server.close(() => {
        console.log('Server has been closed!');
      });
    };
    process.on('SIGTERM', shutDown);
  } catch (error) {
    console.log(error);
  }
})();
