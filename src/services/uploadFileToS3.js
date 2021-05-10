const fs = require('fs');
const util = require('util');
const AWS = require('aws-sdk');

const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_S3_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_S3_SECRET_ACCESS_KEY,
});

const bucketName = process.env.AWS_S3_BUCKET;

const readFile = util.promisify(fs.readFile);

const uploadFileToS3 = async (filePath, s3Path) => {
  const fileContent = await readFile(filePath);

  try {
    const result = await s3
      .upload({
        Bucket: bucketName,
        Key: s3Path,
        Body: fileContent,
      })
      .promise();
    if (result) {
      return result.Location;
    }
  } catch (error) {
    return '';
  }
};

module.exports = uploadFileToS3;
