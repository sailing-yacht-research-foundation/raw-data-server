require('dotenv').config();
const db = require('./models');
const createMQSubscriber = require('./mq');

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
        action: (message, header) => {
          console.log(message, header);
        },
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
