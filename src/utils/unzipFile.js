const zlib = require('zlib');

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

module.exports = gunzipFile;
