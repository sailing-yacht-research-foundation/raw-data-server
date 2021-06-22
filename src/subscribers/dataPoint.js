const { v4: uuidv4 } = require('uuid');

const db = require('../models');

const saveLiveDataPoint = async (data) => {
  await db.liveDataPoint.bulkCreate(data, {
    ignoreDuplicates: true,
  });
};

const getAllLiveDataPoint = async () => {
  const dataPoints = await db.liveDataPoint.findAll({
    raw: true,
  });
  return dataPoints;
};

const getLiveDataPoint = async (id) => {
  const dataPoint = await db.liveDataPoint.findByPk(id, { raw: true });
  return dataPoint;
};

const convertLiveDataToInsertData = (data) => {
  const {
    lat,
    lon,
    speed,
    heading,
    accuracy,
    altitude,
    at,
    tws,
    twa,
    stw,
    raceData,
  } = data;
  return {
    id: uuidv4(),
    location: { type: 'Point', coordinates: [lat, lon] },
    speed,
    heading,
    accuracy,
    altitude,
    at,
    tws,
    twa,
    stw,
    race_unit_id: raceData.raceUnitId,
    boat_participant_group_id: raceData.boatParticipantGroupId,
    boat_id: raceData.boatId,
    device_id: raceData.deviceId,
    user_id: raceData.userId,
    public_id: raceData.publicId,
  };
};

const dataPointSubscriberAction = async (payload, headers) => {
  if (headers.isbatch === 'true') {
    const data = payload.messages.map(convertLiveDataToInsertData);
    await saveLiveDataPoint(data);
  } else {
    const data = convertLiveDataToInsertData(payload);
    await saveLiveDataPoint([data]);
  }
};

module.exports = {
  convertLiveDataToInsertData,
  dataPointSubscriberAction,
  getAllLiveDataPoint,
  getLiveDataPoint,
  saveLiveDataPoint,
};
