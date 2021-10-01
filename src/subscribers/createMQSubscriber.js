const Stomp = require('@syrf/transport-library').Stomp;

const createMQSubscriber = (connDetail, onConnect, subscriptions = []) => {
  const { mqPort, mqHost, mqUser, mqPassword, mqTimeout } = connDetail;
  const stompClient = Stomp.create(mqPort, mqHost, mqUser, mqPassword);
  stompClient.on('connect', () => {
    onConnect();
  });
  stompClient.on('error', (error) => {
    console.error(`MQ Client Error: ${error.message}`);
  });

  if (process.env.NODE_ENV === 'production') {
    const tls = {
      checkServerIdentity: () => {
        return null;
      },
    };
    stompClient.useTLS(tls);
  }

  stompClient
    .retryInterval(1000)
    .incrementalRetryInterval(1000)
    .setConnectionTimeout(mqTimeout)
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
