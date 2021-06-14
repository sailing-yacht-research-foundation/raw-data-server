const Stomp = require('@syrf/transport-library').Stomp;

const createMQSubscriber = (connDetail, onConnect, subscriptions = []) => {
  const { mqPort, mqHost, mqUser, mqPassword } = connDetail;
  const stompClient = Stomp.create(mqPort, mqHost, mqUser, mqPassword);
  stompClient.on('connect', () => {
    onConnect();
  });

  stompClient.retryInterval(1000).incrementalRetryInterval(1000).connect();

  subscriptions.forEach((sub) => {
    const { topic, action } = sub;
    stompClient.subscribe(topic, (message, header) => {
      action(message, header);
    });
  });

  return stompClient;
};

module.exports = createMQSubscriber;
