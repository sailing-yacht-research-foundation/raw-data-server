const AWS = require('aws-sdk');
const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_S3_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_S3_SECRET_ACCESS_KEY,
});

const listAllKeys = async (bucketName) => {
  let params = {
    Bucket: bucketName,
    Prefix: '',
  };
  let objects = await s3.listObjects(params).promise();
  let fileNames = [];
  objects.Contents.forEach((object) => {
    fileNames.push(object['Key']);
  });
  return fileNames;
};

const getObject = async (fileName, bucketName) => {
  let params = {
    Bucket: bucketName,
    Key: fileName,
  };

  var data = await s3.getObject(params).promise();
  let object = data.Body.toString('utf-8');
  return object;
};

module.exports = {
  listAllKeys,
  getObject,
};
