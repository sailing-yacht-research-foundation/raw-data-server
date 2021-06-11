const positions = new Map();

const savePosition = (msg) => {
  if (msg.position) {
    const {
      id,
      boat_id,
      race_id,
      device_id,
      position,
      speed,
      heading,
      accuracy,
      altitude,
      at,
      tws,
      twa,
      stw,
    } = msg;
    positions.set(id, {
      id,
      boat_id,
      race_id,
      device_id,
      position,
      speed,
      heading,
      accuracy,
      altitude,
      at,
      tws,
      twa,
      stw,
    });
  }
};

const getPosition = (id) => {
  return positions.get(id);
};

const getAllPositions = () => {
  return [...positions.values()];
};

const positionSubscriberAction = (payload, headers) => {
  if (headers.isbatch && payload.message[0].position) {
    payload.messages.map(savePosition);
  } else {
    if (payload.position) {
      savePosition(payload);
    }
  }
};

module.exports = {
  savePosition,
  getPosition,
  getAllPositions,
  positionSubscriberAction,
};
