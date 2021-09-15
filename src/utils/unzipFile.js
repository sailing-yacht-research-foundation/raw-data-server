const zlib = require('zlib');
const path = require('path');
const { pipeline } = require('stream');
const { promisify } = require('util');
const fs = require('fs');
const extract = require('extract-zip');
const tar = require('tar-fs');

async function gunzipFile(sourceStream, destinationStream) {
  //   const fileContents = fs.createReadStream(sourcePath);
  //   const writeStream = fs.createWriteStream(destinationPath);
  return new Promise((resolve, reject) => {
    const errorHandler = (err) => {
      destinationStream.destroy();
      reject(err);
    };
    const unzip = zlib.createGunzip();
    const stream = sourceStream.pipe(unzip).pipe(destinationStream);

    stream.on('finish', () => {
      resolve(true);
    });
    sourceStream.on('error', errorHandler);
    destinationStream.on('error', errorHandler);
    unzip.on('error', errorHandler);
  });
}

async function downloadAndExtract({ s3, bucketName, fileName, targetDir }) {
  let writeStream;
  try {
    const options = {
      Bucket: bucketName,
      Key: fileName,
    };
    const s3Object = await s3.getObject(options);
    const sourceStream = s3Object.createReadStream();
    const zipPath = path.join(targetDir, 'raw-data.zip');
    writeStream = fs.createWriteStream(zipPath);
    await promisify(pipeline)(sourceStream, writeStream);
    await unzipFile(zipPath, targetDir);
  } finally {
    if (writeStream) {
      writeStream.destroy();
    }
  }
}

async function unzipFile(zipPath, targetDir) {
  await extract(zipPath, { dir: targetDir });
}
async function downloadAndExtractTar({ s3, bucketName, fileName, targetDir }) {
  const options = {
    Bucket: bucketName,
    Key: fileName,
  };
  const s3Object = await s3.getObject(options);
  const sourceStream = s3Object.createReadStream();
  return new Promise((resolve, reject) => {
    sourceStream
      .pipe(zlib.createGunzip())
      .pipe(tar.extract(targetDir))
      .on('error', reject)
      .on('finish', () => {
        console.log(targetDir);
        resolve(targetDir);
      });
  });
}

module.exports = {
  gunzipFile,
  downloadAndExtract,
  unzipFile,
  downloadAndExtractTar,
};
