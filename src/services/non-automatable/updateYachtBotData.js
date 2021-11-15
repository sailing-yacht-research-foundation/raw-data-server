const db = require('../../models');
const databaseErrorHandler = require('../../utils/databaseErrorHandler');

const updateYachtBotData = async (data) => {
  if (!data.YachtBotRace?.length) {
    console.log('data.YachtBotRace should not be empty');
    return;
  }
  const transaction = await db.sequelize.transaction();
  let errorMessage = '';
  try {
    const race = data.YachtBotRace[0];
    const existingRace = await db.yachtBotRace.findOne({
      where: { original_id: race.original_id?.toString() },
    });

    if (!existingRace) {
      console.log(
        `The race with original_id = ${race.original_id} does not exist in the database`,
      );
      return;
    }
    if (data.YachtBotBuoy) {
      for (const buoy of data.YachtBotBuoy) {
        await db.yachtBotBuoy.update(
          {
            original_object_id: buoy.original_object_id?.toString(),
          },
          {
            where: {
              original_id: buoy.original_id?.toString(),
              race_original_id: race.original_id?.toString(),
            },
            transaction,
          },
        );
      }
    }
    if (data.YachtBotMarks) {
      data.YachtBotMarks = data.YachtBotMarks.map((t) => {
        return { ...t, race: race.id };
      });
      await db.yachtBotMark.bulkCreate(data.YachtBotMarks, {
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

module.exports = updateYachtBotData;
