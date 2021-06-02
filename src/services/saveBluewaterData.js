const db = require('../models');

const Op = db.Sequelize.Op;

const saveBluewaterData = async (data) => {
  switch (true) {
    case Boolean(data.BluewaterBoat): {
      const existBoats = await db.bluewaterBoat.findAll({
        where: {
          id: { [Op.in]: data.BluewaterBoat.map((row) => row.id) },
        },
      });
      const toRemove = existBoats.map((row) => row.id);

      const boatData = data.BluewaterBoat.filter((row) => {
        return !toRemove.includes(row.id);
      });
      await db.bluewaterBoat.bulkCreate(boatData);
    }
    case Boolean(data.BluewaterBoatHandicap): {
      const existBoatHandicaps = await db.bluewaterBoatHandicap.findAll({
        where: {
          id: { [Op.in]: data.BluewaterBoatHandicap.map((row) => row.id) },
        },
      });
      const toRemove = existBoatHandicaps.map((row) => row.id);

      const boatHandicapData = data.BluewaterBoatHandicap.filter((row) => {
        return !toRemove.includes(row.id);
      });
      await db.bluewaterBoatHandicap.bulkCreate(boatHandicapData);
    }
    case Boolean(data.BluewaterBoatSocialMedia): {
      const existBoatSocialMedias = await db.bluewaterBoatSocialMedia.findAll({
        where: {
          id: { [Op.in]: data.BluewaterBoatSocialMedia.map((row) => row.id) },
        },
      });
      const toRemove = existBoatSocialMedias.map((row) => row.id);

      const boatSocialMediaData = data.BluewaterBoatSocialMedia.filter(
        (row) => {
          return !toRemove.includes(row.id);
        },
      );
      await db.bluewaterBoatSocialMedia.bulkCreate(boatSocialMediaData);
    }
    case Boolean(data.BluewaterCrew): {
      const existCrews = await db.bluewaterCrew.findAll({
        where: {
          id: { [Op.in]: data.BluewaterCrew.map((row) => row.id) },
        },
      });
      const toRemove = existCrews.map((row) => row.id);

      const crewData = data.BluewaterCrew.filter((row) => {
        return !toRemove.includes(row.id);
      });
      await db.bluewaterCrew.bulkCreate(crewData);
    }
    case Boolean(data.BluewaterCrewSocialMedia): {
      const existCrewSocialMedias = await db.bluewaterCrewSocialMedia.findAll({
        where: {
          id: { [Op.in]: data.BluewaterCrewSocialMedia.map((row) => row.id) },
        },
      });
      const toRemove = existCrewSocialMedias.map((row) => row.id);

      const crewSocialMediaData = data.BluewaterCrewSocialMedia.filter(
        (row) => {
          return !toRemove.includes(row.id);
        },
      );
      await db.bluewaterCrewSocialMedia.bulkCreate(crewSocialMediaData);
    }
    case Boolean(data.BluewaterMap): {
      const existMaps = await db.bluewaterMap.findAll({
        where: {
          id: { [Op.in]: data.BluewaterCrew.map((row) => row.id) },
        },
      });
      const toRemove = existMaps.map((row) => row.id);

      const mapData = data.BluewaterMap.filter((row) => {
        return !toRemove.includes(row.id);
      });
      await db.bluewaterMap.bulkCreate(mapData);
    }
    case Boolean(data.BluewaterPosition): {
      const existPositions = await db.bluewaterPosition.findAll({
        where: {
          id: { [Op.in]: data.BluewaterPosition.map((row) => row.id) },
        },
      });
      const toRemove = existPositions.map((row) => row.id);

      const positionData = data.BluewaterPosition.filter((row) => {
        return !toRemove.includes(row.id);
      });
      await db.bluewaterPosition.bulkCreate(positionData);
    }
    case Boolean(data.BluewaterRace): {
      const existRaces = await db.bluewaterRace.findAll({
        where: {
          id: { [Op.in]: data.BluewaterRace.map((row) => row.id) },
        },
      });
      const toRemove = existRaces.map((row) => row.id);

      const raceData = data.BluewaterRace.filter((row) => {
        return !toRemove.includes(row.id);
      });
      await db.bluewaterRace.bulkCreate(raceData);
    }
  }

  return true;
};

module.exports = saveBluewaterData;
