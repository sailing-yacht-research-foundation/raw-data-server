const fs = require('fs');
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
      fs.unlink(req.file.path, (err) => {
        if (err) {
          console.log('error deleting: ', err);
        }
      });
    });
  next();
};

module.exports = parsingJsonFile;
