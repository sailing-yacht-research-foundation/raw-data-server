const { v4: uuidv4 } = require('uuid');
const { s3 } = require('../uploadUtil');
const fs = require('fs');
const path = require('path');
const temp = require('temp').track();
const { listDirectories } = require('../../utils/fileUtils');
const { SAVE_DB_POSITION_CHUNK_COUNT } = require('../../constants');
const db = require('../../models');

const { downloadAndExtract } = require('../../utils/unzipFile');

const saveOldGeovoilleData = async (bucketName, fileName) => {
  try {
    let targetDir = temp.mkdirSync('old_geovoille');
    console.log(`Downloading file ${fileName} from s3`);
    await downloadAndExtract({ s3, bucketName, fileName, targetDir });
    const dirName = listDirectories(targetDir)[0];
    const dirPath = path.join(targetDir, dirName);
    const geovoilleGoogleScraped = listDirectories(dirPath)[2];
    const geovoilleGoogleScrapedPath = path.join(
      dirPath,
      geovoilleGoogleScraped,
    );
    const skipped = listDirectories(dirPath)[5];
    const skippedPath = path.join(dirPath, skipped);

    const kmz = listDirectories(dirPath)[4];
    const kmzPath = path.join(dirPath, kmz);
    const html = listDirectories(dirPath)[3];
    const htmlPath = path.join(dirPath, html);

    const files = fs.readdirSync(geovoilleGoogleScrapedPath);
    const skippedFiles = fs.readdirSync(skippedPath);

    for (const file of files) {
      console.log(`Start processing file ${file}`);
      const transaction = await db.sequelize.transaction();
      racePath = path.join(geovoilleGoogleScrapedPath, file);
      const raceData = JSON.parse(fs.readFileSync(racePath));
      let race = {
        id: uuidv4(),
        name: raceData.name,
        url: raceData.url,
        start_time: parseTimestamp(raceData.website_html, true),
      };

      await db.oldGeovoilleRace.create(race, {
        validate: true,
        transaction,
      });

      for (const track of raceData.tracks) {
        let boat = {
          id: uuidv4(),
          race_id: race.id,
          original_id: track.id,
          alt: track.alt,
          arrival: track.arrival,
          durationOrRetired: track.duration_or_retired,
          boatOrSponsor: track.boat_or_sponsor,
          class: track.class,
          name: track.name,
          q: track.q,
        };
        await db.oldGeovoilleBoat.create(boat, {
          validate: true,
          transaction,
        });

        let boatPositions = [];
        var endTime = extractEndtimeFromDuration(
          track.duration_or_retired,
          race.start_time,
        );
        var arrivalTime = parseTimestamp(track.duration_or_retired, false);
        let interval;

        if (endTime) {
          interval = (endTime - race.start_time) / track.track.length;
        } else if (arrivalTime) {
          interval = (arrivalTime - race.start_time) / track.track.length;
        } else {
          interval = 100;
        }
        for (const position of track.track) {
          let boatPosition = {
            id: uuidv4(),
            race_id: race.id,
            boat_id: boat.id,
            boat_original_id: boat.original_id,
            lat: position.lat,
            lon: position.lon,
            timestamp: race.start_time + interval,
          };
          boatPositions.push(boatPosition);
        }

        const _boatPositions = boatPositions.slice();
        while (_boatPositions.length > 0) {
          const splicedArray = _boatPositions.splice(
            0,
            SAVE_DB_POSITION_CHUNK_COUNT,
          );
          await db.oldGeovoilleBoatPosition.bulkCreate(splicedArray, {
            ignoreDuplicates: true,
            validate: true,
            transaction,
          });
        }
      }
      await transaction.commit();
      console.log(`Done processing file ${file}`);
    }

    for (const file of skippedFiles) {
      if (!file.includes('json')) continue;
      console.log(`Start processing file ${file}`);
      const transaction = await db.sequelize.transaction();
      racePath = path.join(skippedPath, file);
      const raceData = JSON.parse(fs.readFileSync(racePath));
      let raceName =
        raceData.name_details.url.match(/(?<=www\.)(.+?)(?=\.com)/)[0] +
        '-' +
        raceData.name_details.url
          .match(/\/(?:.(?!\/))+$/)[0]
          .replace(/(\.....)/, '')
          .replace('/', '');
      let race = {
        id: uuidv4(),
        name: raceName,
        url: raceData.name_details.url,
        start_time: raceData.raw_tracks.tracks[0].loc[0]['0'] * 1000,
      };

      await db.oldGeovoilleRace.create(race, {
        validate: true,
        transaction,
      });

      for (const track of raceData.raw_tracks.tracks) {
        if (track.id === 0) continue;
        let boat = {
          id: uuidv4(),
          race_id: race.id,
          original_id: track.id,
          alt: '',
          arrival: '',
          durationOrRetired: '',
          boatOrSponsor: '',
          class: '',
          name: `boat ${track.id}`,
          q: '',
        };
        await db.oldGeovoilleBoat.create(boat, {
          validate: true,
          transaction,
        });
        const initialTimestamp = track.loc[0]['0'];
        const initialLat = track.loc[0]['1']; //lat
        const initialLon = track.loc[0]['2']; //lon
        let boatPositions = [];
        for (const loc of track.loc.slice(1)) {
          let boatPosition = {
            id: uuidv4(),
            race_id: race.id,
            boat_id: boat.id,
            boat_original_id: boat.original_id,
            lat: (loc['1'] + initialLat) / 100000,
            lon: (loc['2'] + initialLon) / 100000,
            timestamp: initialTimestamp + loc['0'] * 1000,
          };
          boatPositions.push(boatPosition);
        }
        const _boatPositions = boatPositions.slice();
        while (_boatPositions.length > 0) {
          const splicedArray = _boatPositions.splice(
            0,
            SAVE_DB_POSITION_CHUNK_COUNT,
          );
          await db.oldGeovoilleBoatPosition.bulkCreate(splicedArray, {
            ignoreDuplicates: true,
            validate: true,
            transaction,
          });
        }
      }

      await transaction.commit();
      console.log(`Done processing file ${file}`);
    }
  } catch (e) {
    console.log('An error has occured', e.message);
  } finally {
    temp.cleanupSync();
  }
};

const parseTimestamp = function (rawString, isHtml) {
  var datetimeString = '';
  if (isHtml) {
    datetimeString = rawString
      .split('datetime')[1]
      .split('div')[0]
      .replace(/>|<|\/|"/g, '');
  } else {
    datetimeString = rawString;
  }
  var sliced = datetimeString.match(
    /([\d]{2}[:]{1}[\d]{2}[:]{1}[\d]{2}|[\d]{2}:[\d]{2})/,
  );

  if (sliced === null) return null;

  var [hour, minute, second] = sliced[0].split(':');
  if (second == null) second = '00';
  const dateString = datetimeString
    .match(/([\d]{8}|[\d]{2}\/[\d]{2}\/[\d]{4}|[\d]{4}\/[\d]{2}\/[\d]{2})/)[0]
    .replace(/[/]/g, '');
  var yearSlice = datetimeString.match(/([\d]{4}\/[\d]{2}\/[\d]{2}|[\d]{4} )/);
  var yearFirst =
    datetimeString.match(/([\d]{4}\/[\d]{2}\/[\d]{2}|[\d]{8})/) != null;
  if (parseInt(yearSlice) > 2000 && yearFirst == true) {
    yearFirst = false;
  }
  const year = yearFirst
    ? `${dateString[0]}${dateString[1]}${dateString[2]}${dateString[3]}`
    : `${dateString[4]}${dateString[5]}${dateString[6]}${dateString[7]}`;
  const day = yearFirst
    ? `${dateString[6]}${dateString[7]}`
    : `${dateString[0]}${dateString[1]}`;
  const month = yearFirst
    ? `${dateString[4]}${dateString[5]}`
    : `${dateString[2]}${dateString[3]}`;
  const date = new Date(`${year}-${month}-${day}T${hour}:${minute}:${second}Z`);
  return date.getTime();
};

const extractEndtimeFromDuration = function (datetimeString, startTime) {
  var sliced = datetimeString.match(
    /[\d]{2}[h]{1} [\d]{2}[m][i][n]{1} [\d]{2}[s]{1}/,
  );

  if (sliced === null) return null;

  const [hour, minute, second] = sliced[0].replace(/[A-z]/g, '').split(' ');
  if (!hour || !minute || !second) return null;

  var date = new Date(startTime);
  date.setHours(date.getHours() + parseInt(hour));
  date.setMinutes(date.getMinutes() + parseInt(minute));
  date.setSeconds(date.getSeconds() + parseInt(second));
  return date.getTime();
};
module.exports = saveOldGeovoilleData;
