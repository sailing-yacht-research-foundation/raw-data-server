const db = require('../models');

const saveBluewaterData = async (data) => {
  if (data.BluewaterBoat) {
    await db.bluewaterBoat.bulkCreate(data.BluewaterBoat, {
      ignoreDuplicates: true,
    });
  }
  if (data.BluewaterBoatHandicap) {
    await db.bluewaterBoatHandicap.bulkCreate(data.BluewaterBoatHandicap, {
      ignoreDuplicates: true,
    });
  }
  if (data.BluewaterBoatSocialMedia) {
    await db.bluewaterBoatSocialMedia.bulkCreate(
      data.BluewaterBoatSocialMedia,
      {
        ignoreDuplicates: true,
      },
    );
  }
  if (data.BluewaterCrew) {
    await db.bluewaterCrew.bulkCreate(data.BluewaterCrew, {
      ignoreDuplicates: true,
    });
  }
  if (data.BluewaterCrewSocialMedia) {
    await db.bluewaterCrewSocialMedia.bulkCreate(
      data.BluewaterCrewSocialMedia,
      {
        ignoreDuplicates: true,
      },
    );
  }
  if (data.BluewaterMap) {
    await db.bluewaterMap.bulkCreate(data.BluewaterMap, {
      ignoreDuplicates: true,
    });
  }
  if (data.BluewaterPosition) {
    await db.bluewaterPosition.bulkCreate(data.BluewaterPosition, {
      ignoreDuplicates: true,
    });
  }
  if (data.BluewaterRace) {
    await db.bluewaterRace.bulkCreate(data.BluewaterRace, {
      ignoreDuplicates: true,
    });
  }

  return true;
};

module.exports = saveBluewaterData;
