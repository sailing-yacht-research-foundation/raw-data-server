const unzip = require('zlib').createGunzip();

async function gunzipFile(sourceStream, destinationStream) {
  //   const fileContents = fs.createReadStream(sourcePath);
  //   const writeStream = fs.createWriteStream(destinationPath);
  return new Promise((resolve, reject) => {
    const errorHandler = (err) => {
      destinationStream.destroy();
      reject(err);
    };
    const stream = sourceStream.pipe(unzip).pipe(destinationStream);

    stream.on('finish', () => {
      console.log('finisihing unzip');
      resolve(true);
    });
    sourceStream.on('error', errorHandler);
    destinationStream.on('error', errorHandler);
    unzip.on('error', errorHandler);
  });
}

module.exports = gunzipFile;
