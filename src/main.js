require('dotenv').config();
const db = require('./models');
const createMQSubscriber = require('./subscribers/createMQSubscriber');
const { positionSubscriberAction } = require('./subscribers/position');

const createServer = require('./server');
const port = process.env.PORT || 3000;
const mqHost = process.env.MQ_HOST || 'localhost';
const mqPort = process.env.MQ_PORT || 61613;
const mqUser = process.env.MQ_USER || 'guest';
const mqPassword = process.env.MQ_PASSWORD || 'guest';

(async () => {
  try {
    const app = createServer();

    await db.sequelize.sync();

    const onConnect = () => {
      console.log('connected successfully');
    };
    const subscriptions = [
      {
        topic: '/topic/rawdata.topic',
        action: positionSubscriberAction,
      },
    ];
    const stompClient = createMQSubscriber(
      { mqHost, mqPort, mqUser, mqPassword },
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
