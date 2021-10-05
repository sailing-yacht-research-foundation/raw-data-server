const { s3 } = require('../../uploadUtil');
const { deserializeBsonFromFile } = require('../../bsonUtil');
const fs = require('fs');
const path = require('path');
const temp = require('temp').track();
const { listDirectories } = require('../../../utils/fileUtils');
const db = require('../../../models');

const { downloadAndExtractTar } = require('../../../utils/unzipFile');
const isRegadataRaceExist = require('./isRegadataRaceExist');
const createRaceForRegadata = require('./createRaceForRegadata');
const createSailForRegadata = require('./createSailForRegadata');
const createReportForRegadata = require('./createReportForRegadata');
const {
  normalizeRegadata,
} = require('../../normalization/non-automatable/normalizeRegadata');
/**
 * 1. Download the tar.gz file from internet.
 * 2. Extract the file into the temporary folder.
 * 3. Process the files and save race, sail and report information to related tables.
 * 4. Once race is done, a commit is called and push everything into database.
 * 5. Finally the temp folder will be clear
 * @param {string} bucketName name of the bucket of s3
 * @param {string} fileName file name to be downloaded
 */
const saveRegadata = async (bucketName, fileName) => {
  try {
    const targetDir = temp.mkdirSync('regadata_rawdata');
    console.log(`Downloading file ${fileName} from s3`);
    await downloadAndExtractTar({ s3, bucketName, fileName, targetDir });
    const allDataDir = listDirectories(targetDir)[0];
    const allDataPath = path.join(targetDir, allDataDir);
    const sailFiles = fs
      .readdirSync(allDataPath)
      .filter((t) => t.indexOf('_sails.bson') >= 0);
    for (const sailFile of sailFiles) {
      await processSailFile(allDataPath, sailFile);
    }
  } catch (e) {
    console.log('An error has occured while processing regadata', e.message);
  } finally {
    temp.cleanupSync();
  }
};

/**
 * Process the bson file taken from old archived file
 * After this operation there are 3 affected tables
 * 1. RegadataRaces
 * 2. RegadataSails: one race will have have sails (One to Many relationship)
 * 3. RegadataReports: one sail will have many reports (One to Many relationship)
 * @param {string} rootDirt
 * @param {string} sailFile
 */
const processSailFile = async (rootDirt, sailFile) => {
  const transaction = await db.sequelize.transaction();
  console.log(`Processing ${sailFile}`);
  try {
    const sailName = sailFile.substring(0, sailFile.indexOf('_sail'));
    const reportFiles = fs
      .readdirSync(rootDirt)
      .filter(
        (t) => t.indexOf('_reports.bson') >= 0 && t.indexOf(sailName) >= 0,
      );
    const raceNames = reportFiles.map((t) =>
      t.substring(0, t.indexOf('_reports')),
    );

    // we have this loop because we have many races for a single sail file
    // For example vor2014_sails.bson will have 2 mapped reports files 'vor2014-1_reports' and 'vor2014-2_reports'
    // So we will create 2 race vor2014-1 and vor2014-2
    for (const raceName of raceNames) {
      // if the race is exist, it means this race is processed, we can ignore and move to next race
      if (await isRegadataRaceExist(raceName)) {
        console.log(`raceName = ${raceName} is exist`);
        continue;
      }
      const race = await createRaceForRegadata(transaction, raceName);
      const sailData = await deserializeBsonFromFile(
        path.join(rootDirt, sailFile),
      );
      const [mapSailId, regaDataSails] = await createSailForRegadata(
        transaction,
        race,
        sailData,
      );
      const reportPath = path.join(rootDirt, `${raceName}_reports.bson`);
      const reportData = await deserializeBsonFromFile(reportPath);

      const regadataReports = await createReportForRegadata(
        transaction,
        race,
        mapSailId,
        reportData,
      );
      console.log(
        `For race = ${raceName}, sailData.length = ${sailData.length} reportData.length = ${reportData.length}`,
      );
      await normalizeRegadata(
        { regadataRace: race, regaDataSails, regadataReports },
        transaction,
      );
    }
    await transaction.commit();
    console.log(`Finished saving race ${sailFile}`);
  } catch (error) {
    console.log('Error processing race', error);
    if (transaction) {
      await transaction.rollback();
    }
  }
};
module.exports = saveRegadata;
