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
  const { lat, lon, sog, cog, twa, setDrift, raceData } = data;
  return {
    id: uuidv4(),
    location: {
      crs: {
        type: 'name',
        properties: { name: 'EPSG:4326' },
      },
      type: 'Point',
      coordinates: [lon, lat],
    },
    sog,
    cog,
    twa,
    set_drift: setDrift,
    competition_unit_id: raceData.competitionUnitId,
    vessel_participant_id: raceData.vesselParticipantId,
    participant_id: raceData.participantId,
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
