const fs = require('fs');
const util = require('util');
const AWS = require('aws-sdk');
const db = require('../models');
const { v4: uuidv4 } = require('uuid');

const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_S3_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_S3_SECRET_ACCESS_KEY,
});

const BUCKET_NAME = process.env.AWS_S3_BUCKET;
const GEOJSON_BUCKET_NAME = process.env.AWS_GEOJSON_S3_BUCKET;

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

const uploadGeoJsonToS3 = async (raceId, geojson, source, transaction) => {
  const obj = await db.readyAboutTrackGeoJsonLookup.findOne({
    where: {
      id: raceId,
    },
  });
  if (obj) {
    console.log('Object id already exist in lookup table');
    return;
  }

  const lookupId = uuidv4();
  const file = lookupId + '.geojson';
  // Uploading files to the bucket
  const result = await uploadDataToS3({
    Bucket: GEOJSON_BUCKET_NAME,
    Key: file, // File name you want to save as in S3
    Body: geojson,
  });

  await db.readyAboutTrackGeoJsonLookup.create(
    {
      id: raceId,
      source,
      s3_id: lookupId,
    },
    { transaction },
  );
  return result.Location;
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
  uploadGeoJsonToS3,
  uploadDataToS3,
  deleteObjectInS3,
};
