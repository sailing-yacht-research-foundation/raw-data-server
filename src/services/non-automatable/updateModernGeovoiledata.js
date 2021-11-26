const db = require('../../models');
const databaseErrorHandler = require('../../utils/databaseErrorHandler');

const updateModernGeovoiledata = async (data) => {
  if (!data.race) {
    console.log('data.race should not be empty');
    return;
  }
  const transaction = await db.sequelize.transaction();
  let errorMessage = '';
  try {
    const race = data.race;
    const existingRace = await db.geovoileRace.findOne({
      where: { original_id: race.original_id },
    });

    if (!existingRace) {
      console.log(
        `The race with original_id = ${race.original_id} does not exist in the database`,
      );
      return;
    }

    if (data.boats) {
      for (const boat of data.boats) {
        await db.geovoileBoat.update(
          {
            arrival: boat.arrival,
          },
          {
            where: {
              original_id: boat.original_id,
              race_original_id: race.original_id,
            },
            transaction,
          },
        );
      }
    }

    if (data.marks?.length) {
      const existingMarks = await db.geovoileMark.findAll({
        where: { race_original_id: race.original_id },
      });

      // remove duplicate marks
      data.marks = data.marks
        .map((t) => {
          const duplicateMark = existingMarks.find(
            (existingMark) =>
              existingMark.lat === t.lat && existingMark.lon === t.lon,
          );
          if (duplicateMark) {
            return null;
          }
          return {
            ...t,
            race_id: existingRace.id,
            race_original_id: existingRace.original_id,
          };
        })
        .filter((t) => t);

      await db.geovoileMark.bulkCreate(data.marks, {
        ignoreDuplicates: true,
        validate: true,
        transaction,
      });
    }

    await transaction.commit();
  } catch (error) {
    console.log(error.toString());
    await transaction.rollback();
    errorMessage = databaseErrorHandler(error);
  }

  return errorMessage;
};

module.exports = updateModernGeovoiledata;
