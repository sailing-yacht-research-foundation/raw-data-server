/**
 * Original Post: https://stackoverflow.com/questions/56585231/how-to-deserialize-dumped-bson-with-arbitrarily-many-documents-in-javascript
 * The bson util is for reading bson file and transfer it to javascript object.
 */
const BSON = require('bson');
const fs = require('fs');

function _getNextObjectSize(buffer) {
  // this is how BSON
  return buffer[0] | (buffer[1] << 8) | (buffer[2] << 16) | (buffer[3] << 24);
}

/**
 * deserializeBson
 * @param {Buffer} buffer
 * @param {Bson Options} options
 * @returns
 */
function deserializeBson(buffer, options) {
  let _buffer = buffer;
  let _result = [];

  while (_buffer.length > 0) {
    let nextSize = _getNextObjectSize(_buffer);
    if (_buffer.length < nextSize) {
      throw new Error('Corrupted BSON file: the last object is incomplete.');
    } else if (_buffer[nextSize - 1] !== 0) {
      throw new Error(
        `Corrupted BSON file: the ${
          _result.length + 1
        }-th object does not end with 0.`,
      );
    }

    let obj = BSON.deserialize(_buffer, {
      ...options,
      allowObjectSmallerThanBufferSize: true,
      promoteBuffers: true, // Since BSON support raw buffer as data type, this config allows
      // these buffers as is, which is valid in JS object but not in JSON
    });
    _result.push(obj);
    _buffer = _buffer.slice(nextSize);
  }

  return _result;
}

/**
 * Deserialize Bson file (the file of mongodb)
 * @param {string} fileName
 * @param {*} options
 * @returns JavaScript Object Taken from Bson File
 */
function deserializeBsonFromFile(fileName, options) {
  const fileBuffer = fs.readFileSync(fileName);

  return deserializeBson(fileBuffer, options);
}
module.exports = {
  deserializeBson: deserializeBson,
  deserializeBsonFromFile: deserializeBsonFromFile,
};
