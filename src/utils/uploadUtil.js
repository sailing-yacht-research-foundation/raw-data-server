const fs = require('fs');
const util = require('util');
const AWS = require('aws-sdk');

const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_S3_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_S3_SECRET_ACCESS_KEY,
});

const BUCKET_NAME = process.env.AWS_S3_BUCKET;

const readFile = util.promisify(fs.readFile);

const uploadFileToS3 = async (filePath, s3Path) => {
  const fileContent = await readFile(filePath);

  try {
    const result = await s3
      .upload({
        Bucket: BUCKET_NAME,
        Key: s3Path,
        Body: fileContent,
      })
      .promise();
    return result.Location;
  } catch (error) {
    console.log('Failed uploading file to s3', error);
    return '';
  }
};

const uploadDataToS3 = async (params) => {
  return await s3.upload(params).promise();
};

const deleteObjectInS3 = async (params) => {
  return await s3.deleteObject(params).promise();
};

module.exports = {
  s3,
  uploadFileToS3,
  uploadDataToS3,
  deleteObjectInS3,
};
