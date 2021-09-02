const fs = require('fs');
const xml2json = require('xml2json');
const csvtojson = require('csvtojson');

const listDirectories = (dirPath) => {
  return fs
    .readdirSync(dirPath, { withFileTypes: true })
    .filter((dirent) => dirent.isDirectory())
    .map((dirent) => dirent.name);
};

const readXmlFileToJson = (path) => {
  const pathExist = fs.existsSync(path);
  if (pathExist) {
    const xml = fs.readFileSync(path);
    const jsonString = xml2json.toJson(xml);
    return JSON.parse(jsonString);
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

const listFiles = (path) => {
  let fileNames = [];
  fs.readdirSync(path).forEach((file) => {
    fileNames.push(file);
  });
  return fileNames;
};

module.exports = {
  listDirectories,
  readXmlFileToJson,
  readCsvFileToJson,
  listFiles,
};
