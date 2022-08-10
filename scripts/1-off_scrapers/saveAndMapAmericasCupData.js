require('dotenv').config();
const saveAmericasCupData = require('../../src/services/non-automatable/saveAmericasCupData');

/**
 * This script reads Americas Cup 2013 or 2016 raw data and map and save to syrf schema database
 *
 */

(async () => {
  // Set local file path where the Americas Cup files are extracted. Eg. D:\\path\\to\\SYRF\\Americas Cup Data
  // If raw data is in s3 bucket, remove filePath param and use bucketName, fileName, year. (FileName should be a zip file)
  // Eg. await saveAmericasCupData({ bucketName: 'databacklog', fileName: 'Americas_Cup_2013.zip', year: '2013' })
  const filePath = 'D:\\jack\\Scopic files\\SYRF\\Americas Cup Sample Data';
  const year = '2013';
  await saveAmericasCupData({ filePath, year });
})();
