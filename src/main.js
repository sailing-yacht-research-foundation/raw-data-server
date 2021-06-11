require('dotenv').config();
const db = require('./models');
const createMQSubscriber = require('./subscribers/createMQSubscriber');
const { positionSubscriberAction } = require('./subscribers/position');

const createServer = require('./server');
const port = process.env.PORT || 3000;

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
    createMQSubscriber(onConnect, subscriptions);

    app.listen(port, () => {
      console.log(`Server has started! Listening on ${port}`);
    });
  } catch (error) {
    console.log(error);
  }
})();
