const temp = require('temp').track();
const jsonfile = require('jsonfile');

var parsingJsonFile = function (req, res, next) {
  jsonfile
    .readFile(req.file.path)
    .then((jsonData) => {
      // TODO: Save parsed data to database
      console.dir(jsonData);
    })
    .catch((err) => {
      // TODO: Handle error better
      console.error(err);
    })
    .finally(() => {
      temp.cleanup();
    });
  next();
};

module.exports = parsingJsonFile;
