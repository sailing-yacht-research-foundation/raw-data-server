const { v4: uuidv4 } = require('uuid');
const { s3 } = require('../uploadUtil');
const fs = require('fs');
const path = require('path');
const temp = require('temp').track();
const { listDirectories } = require('../../utils/fileUtils');
const { SAVE_DB_POSITION_CHUNK_COUNT } = require('../../constants');
const db = require('../../models');

const { downloadAndExtractTar } = require('../../utils/unzipFile');
const { dirname } = require('path');

const saveRegadata = async (bucketName, fileName) => {
  try {
    let targetDir = temp.mkdirSync('regadata_rawdata');
    console.log(`Downloading file ${fileName} from s3`);
    await downloadAndExtractTar({ s3, bucketName, fileName, targetDir });
    const allDataDir = listDirectories(targetDir)[0];
    const allDataPath = path.join(targetDir, allDataDir);
    const sailFiles = fs
      .readdirSync(allDataPath)
      .filter((t) => t.indexOf('_sails.bson') >= 0);
    for (const sailFile of sailFiles) {
      const transaction = await db.sequelize.transaction();
      console.log(`Processing ${sailFile}`);
      try {
        const raceName = sailFile.substring(0, sailFile.indexOf('_sail'));
        const reportPath = path.join(allDataPath, `${raceName}_reports.bson`);

        console.log(`raceName = ${raceName}, reportPath = ${reportPath}`);

        const existingRace = await db.regadataRace.findOne({
          where: { original_id: raceName },
        });
        if (existingRace) {
          console.log(`raceName = ${raceName} is exist`);
          continue;
        }
        // TODO: create race
        // TODO: read sail from bson then create sail
        // TODO: read report from bson then create report
        await transaction.commit();
        console.log(`Finished saving race ${sailFile}`);
      } catch (error) {
        console.log('Error processing race', error);
        await transaction.rollback();
      }
    }
  } catch (e) {
    console.log('An error has occured', e.message);
  } finally {
    temp.cleanupSync();
  }
};

module.exports = saveRegadata;
