const db = require('../../models');
const databaseErrorHandler = require('../../utils/databaseErrorHandler');

const updateYachtBotMarksRace = async () => {
  let transaction;
  let errorMessage = '';
  try {
    transaction = await db.sequelize.transaction();
    const existingRaces = await db.yachtBotRace.findAll({
      attributes: ['id', 'original_id'],
    });

    for (const currentRace of existingRaces) {
      console.log(`update race = ${currentRace.original_id}`);
      await db.yachtBotMark.update(
        {
          race: currentRace.id,
        },
        {
          where: {
            race_original_id: currentRace.original_id?.toString(),
          },
          transaction,
        },
      );
    }
    await transaction.commit();
    console.log(`updateYachtBotMarksRace run successfully`);
  } catch (error) {
    console.log(
      'There was a problem during processing updateYachtBotMarksRace',
    );
    console.log(error.toString());
    if (transaction) {
      await transaction.rollback();
    }
    errorMessage = databaseErrorHandler(error);
  }

  return errorMessage;
};

module.exports = updateYachtBotMarksRace;
