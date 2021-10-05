const fs = require('fs');
const parseStringPromise = require('xml2js').parseStringPromise;
const csvtojson = require('csvtojson');

const listDirectories = (dirPath) => {
  return fs
    .readdirSync(dirPath, { withFileTypes: true })
    .filter((dirent) => dirent.isDirectory())
    .map((dirent) => dirent.name);
};

const readXmlFileToJson = async (path) => {
  const pathExist = fs.existsSync(path);
  if (pathExist) {
    const xml = fs.readFileSync(path);
    const jsonObj = await parseStringPromise(xml, {
      explicitArray: false,
      mergeAttrs: true,
    });
    return jsonObj;
  }
  return;
};

const readCsvFileToJson = async (path) => {
  const pathExist = fs.existsSync(path);
  if (pathExist) {
    return await csvtojson().fromFile(path);
  }
  return;
};

module.exports = {
  listDirectories,
  readXmlFileToJson,
  readCsvFileToJson,
};
