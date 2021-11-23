const zlib = require('zlib');
const path = require('path');
const { pipeline } = require('stream');
const { promisify } = require('util');
const fs = require('fs');
const extract = require('extract-zip');
const tar = require('tar-fs');
const JSONStream = require('JSONStream');
const temp = require('temp');

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

async function unzipFileFromRequest(req) {
  // gunzip
  let unzippedJsonPath = req.file.path;
  try {
    if (req.file.mimetype === 'application/gzip') {
      console.log('Got gzip file');
      unzippedJsonPath = (await temp.open('georacing')).path;
      const sourceStream = fs.createReadStream(req.file.path);
      const writeStream = fs.createWriteStream(unzippedJsonPath);
      await gunzipFile(sourceStream, writeStream);
      fs.unlink(req.file.path, (err) => {
        if (err) {
          console.log('error deleting: ', err);
        }
      });
    }

    const jsonData = {};

    await new Promise((resolve, reject) => {
      const errorHandler = (err) => {
        reject(err);
      };
      const stream = fs.createReadStream(unzippedJsonPath);
      // Need to use this emitPath: true
      // So we can get what properties the data latched on (TrackerRace, TrackerPosition, etc)
      // This way we don't need to add a new form data to this endpoint
      const parser = JSONStream.parse([true, { emitPath: true }]);
      stream.on('error', errorHandler);
      parser.on('error', errorHandler);
      stream.pipe(parser);
      parser.on('data', async function (row) {
        // during streaming the row, if the data is object then row.path[1]
        // is the object property (not a number)
        // if the data is array then row.path[1] is the index number of object.
        if (isNaN(row.path[1])) {
          if (!jsonData[row.path[0]]) {
            jsonData[row.path[0]] = {};
          }
          jsonData[row.path[0]][row.path[1]] = row.value;
        } else {
          // case array
          if (jsonData[row.path[0]] === undefined) {
            jsonData[row.path[0]] = [];
          }
          jsonData[row.path[0]].push(row.value);
        }
      });
      stream.on('close', () => {
        resolve(true);
      });
    });
    return { jsonData };
  } catch (e) {
    console.log('error on unzipFileFromRequest');
    console.log(e);
  } finally {
    fs.unlink(unzippedJsonPath, (err) => {
      if (err) {
        console.log('error deleting: ', err);
      }
    });
  }
}

module.exports = {
  gunzipFile,
  downloadAndExtract,
  unzipFile,
  downloadAndExtractTar,
  unzipFileFromRequest,
};
