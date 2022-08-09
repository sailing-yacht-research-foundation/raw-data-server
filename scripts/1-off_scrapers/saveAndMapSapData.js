require('dotenv').config();
const saveSapData = require('../../src/services/non-automatable/saveSapData');

/**
 * This script reads SAP raw data and map and save to syrf schema database
 *
 */

(async () => {
  // Set local file path where the SAP files are extracted. Eg. D:\\path\\to\\SYRF\\SAP Final Race
  // If raw data is in s3 bucket, remove filePath param and use bucketName, fileName. (FileName should be a zip file)
  // Eg. await saveSapData({ bucketName: 'databacklog', fileName: 'SAP Part 1.zip' })
  const filePath = '';
  await saveSapData({ filePath });
})();
