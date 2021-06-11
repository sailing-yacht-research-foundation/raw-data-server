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
  if (headers.isbatch) {
    payload.messages.map(savePosition);
  } else {
    savePosition(payload);
  }
};

module.exports = {
  savePosition,
  getPosition,
  getAllPositions,
  positionSubscriberAction,
};
