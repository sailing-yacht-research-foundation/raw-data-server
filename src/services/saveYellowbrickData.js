const { v4: uuidv4 } = require('uuid');

const db = require('../models');
const databaseErrorHandler = require('../utils/databaseErrorHandler');

const saveYellowbrickData = async (data) => {
  const transaction = await db.sequelize.transaction();
  let errorMessage = '';
  let raceUrl = [];
  try {
    if (data.YellowbrickRace) {
      raceUrl = data.YellowbrickRace.map((row) => {
        return { url: row.url, original_id: row.race_code };
      });
      await db.yellowbrickRace.bulkCreate(data.YellowbrickRace, {
        ignoreDuplicates: true,
        validate: true,
        transaction,
      });
    }
    if (data.YellowbrickCourseNode) {
      await db.yellowbrickCourseNode.bulkCreate(data.YellowbrickCourseNode, {
        ignoreDuplicates: true,
        validate: true,
        transaction,
      });
    }
    if (data.YellowbrickLeaderboardTeam) {
      await db.yellowbrickLeaderboardTeam.bulkCreate(
        data.YellowbrickLeaderboardTeam,
        {
          ignoreDuplicates: true,
          validate: true,
          transaction,
        },
      );
    }
    if (data.YellowbrickPoi) {
      await db.yellowbrickPoi.bulkCreate(data.YellowbrickPoi, {
        ignoreDuplicates: true,
        validate: true,
        transaction,
      });
    }
    if (data.YellowbrickPosition) {
      while (data.YellowbrickPosition.length > 0) {
        const splicedArray = data.YellowbrickPosition.splice(0, 1000);
        await db.yellowbrickPosition.bulkCreate(splicedArray, {
          ignoreDuplicates: true,
          validate: true,
          transaction,
        });
      }
    }
    if (data.YellowbrickTag) {
      await db.yellowbrickTag.bulkCreate(data.YellowbrickTag, {
        ignoreDuplicates: true,
        validate: true,
        transaction,
      });
    }
    if (data.YellowbrickTeam) {
      await db.yellowbrickTeam.bulkCreate(data.YellowbrickTeam, {
        ignoreDuplicates: true,
        validate: true,
        transaction,
      });
    }
    await transaction.commit();
  } catch (error) {
    await transaction.rollback();
    errorMessage = databaseErrorHandler(error);
  }

  if (raceUrl.length > 0) {
    if (errorMessage) {
      await db.yellowbrickFailedUrl.bulkCreate(
        raceUrl.map((row) => {
          return {
            id: uuidv4(),
            url: row.url,
            error: errorMessage,
          };
        }),
        {
          ignoreDuplicates: true,
          validate: true,
        },
      );
    } else {
      await db.yellowbrickSuccessfulUrl.bulkCreate(
        raceUrl.map((row) => {
          return {
            id: uuidv4(),
            url: row.url,
            original_id: row.original_id,
          };
        }),
        {
          ignoreDuplicates: true,
          validate: true,
        },
      );
    }
  }

  return errorMessage;
};

module.exports = saveYellowbrickData;
