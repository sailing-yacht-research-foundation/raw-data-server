require('dotenv').config();
const db = require('./models');
const createMQSubscriber = require('./subscribers/createMQSubscriber');
const { dataPointSubscriberAction } = require('./subscribers/dataPoint');

const createServer = require('./server');
const port = process.env.PORT || 3000;
const mqHost = process.env.MQ_HOST || 'localhost';
const mqPort = process.env.MQ_PORT || 61613;
const mqUser = process.env.MQ_USER || 'guest';
const mqPassword = process.env.MQ_PASSWORD || 'guest';
const mqTimeout = Number(process.env.MQ_TIMEOUT) || 2700000;
const mqTopic = process.env.MQ_TOPIC || '/topic/rawdata.topic';

(async () => {
  try {
    const app = createServer();

    await db.sequelize.sync();

    const onConnect = () => {
      console.log('MQ connected successfully');
    };
    const subscriptions = [
      {
        topic: mqTopic,
        action: dataPointSubscriberAction,
      },
    ];
    const stompClient = createMQSubscriber(
      { mqHost, mqPort, mqUser, mqPassword, mqTimeout },
      onConnect,
      subscriptions,
    );

    const server = app.listen(port, () => {
      console.log(`Server has started! Listening on ${port}`);
    });

    const shutDown = () => {
      console.log('Signal received! Closing...');
      stompClient.destroy();
      server.close(() => {
        console.log('Server has been closed!');
      });
    };
    process.on('SIGTERM', shutDown);
  } catch (error) {
    console.log(error);
  }
})();
