const db = require('../models');

const Op = db.Sequelize.Op;

const saveTracTracData = async (data) => {
  if (data.SailorEmail) {
    const existSailorEmail = await db.sailorEmail.findAll({
      where: { id: { [Op.in]: data.SailorEmail.map((row) => row.id) } },
    });
    const toRemove = existSailorEmail.map((row) => row.id);

    const clubData = data.SailorEmail.filter((row) => {
      return !toRemove.includes(row.id);
    });
    await db.sailorEmail.bulkCreate(clubData);
  }
  return true;
};

module.exports = saveTracTracData;
