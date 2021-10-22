const AWS = require('aws-sdk');
const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_S3_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_S3_SECRET_ACCESS_KEY,
});

const stream = require('stream');

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

const uploadMapScreenshot = async (imageBuffer, fileName) => {
  const params = {
    ACL: 'public-read',
    Bucket: process.env.OPEN_GRAPH_BUCKET_NAME,
    Key: `public/${fileName}`,
    Body: imageBuffer,
    ContentEncoding: 'base64',
    ContentType: 'image/png',
  };
  const response = await s3.upload(params).promise();
  return response;
};

const uploadStreamToS3 = (bucket, key) => {
  const passThrough = new stream.PassThrough();

  const uploadPromise = s3
    .upload({
      Bucket: bucket,
      Key: key,
      Body: passThrough,
    })
    .promise();

  return { writeStream: passThrough, uploadPromise };
};

module.exports = {
  listAllKeys,
  getObject,
  uploadMapScreenshot,
  uploadStreamToS3,
};
