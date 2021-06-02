const db = require('../models');

const Op = db.Sequelize.Op;

const filterAndSaveData = async (data, model) => {
  const existData = await model.findAll({
    where: { id: { [Op.in]: data.map((row) => row.id) } },
  });
  const toRemove = existData.map((row) => row.id);

  const filteredData = data.filter((row) => {
    return !toRemove.includes(row.id);
  });
  await model.bulkCreate(filteredData);
};

const saveTracTracData = async (data) => {
  if (data.SailorEmail) {
    await filterAndSaveData(data.SailorEmail, db.sailorEmail);
  }
  if (data.TracTracEvent) {
    await filterAndSaveData(data.TracTracEvent, db.tractracEvent);
  }
  if (data.TracTracRace) {
    await filterAndSaveData(data.TracTracRace, db.tractracRace);
  }
  if (data.TracTracClass) {
    await filterAndSaveData(data.TracTracClass, db.tractracClass);
  }
  if (data.TracTracRaceClass) {
    await filterAndSaveData(data.TracTracRaceClass, db.tractracRaceClass);
  }
  if (data.TracTracCompetitor) {
    await filterAndSaveData(data.TracTracCompetitor, db.tractracCompetitor);
  }
  if (data.TracTracCompetitorResult) {
    await filterAndSaveData(
      data.TracTracCompetitorResult,
      db.tractracCompetitorResult,
    );
  }
  if (data.TracTracCompetitorPosition) {
    await filterAndSaveData(
      data.TracTracCompetitorPosition,
      db.tractracCompetitorPosition,
    );
  }
  if (data.TracTracCompetitorPassing) {
    await filterAndSaveData(
      data.TracTracCompetitorPassing,
      db.tractracCompetitorPassing,
    );
  }
  if (data.TracTracRoute) {
    await filterAndSaveData(data.TracTracRoute, db.tractracRoute);
  }
  if (data.TracTracControl) {
    await filterAndSaveData(data.TracTracControl, db.tractracControl);
  }
  if (data.TracTracControlPoint) {
    await filterAndSaveData(data.TracTracControlPoint, db.tractracControlPoint);
  }
  if (data.TracTracControlPointPosition) {
    await filterAndSaveData(
      data.TracTracControlPointPosition,
      db.tractracControlPointPosition,
    );
  }
  return true;
};

module.exports = saveTracTracData;
