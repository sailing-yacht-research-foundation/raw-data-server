const Stomp = require('@syrf/transport-library').Stomp;

const mqHost = process.env.MQ_HOST || 'localhost';
const mqPort = process.env.MQ_PORT || 61613;
const mqUser = process.env.MQ_USER || 'guest';
const mqPassword = process.env.MQ_PASSWORD || 'guest';

const createMQSubscriber = (onConnect, subscriptions = []) => {
  const stompClient = Stomp.create(mqPort, mqHost, mqUser, mqPassword);
  stompClient.on('connect', () => {
    onConnect();
  });

  stompClient
    .retryInterval(1000)
    .incrementalRetryInterval(1000)
    .setConnectionTimeout(3600000)
    .connect();

  subscriptions.forEach((sub) => {
    const { topic, action } = sub;
    stompClient.subscribe(topic, (message, header) => {
      action(message, header);
    });
  });

  return stompClient;
};

module.exports = createMQSubscriber;
