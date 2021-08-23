const { v4: uuidv4 } = require('uuid');
const { s3 } = require('../uploadUtil');
const fs = require('fs');
const path = require('path');
const temp = require('temp').track();
const { downloadAndExtract } = require('../../utils/unzipFile');
const { appendArray } = require('../../utils/arrayUtils');
const { listDirectories, readXmlFileToJson, readCsvFileToJson } = require('../../utils/fileUtils');

const { SAVE_DB_POSITION_CHUNK_COUNT, AMERICAS_CUP_TABLE_SUFFIX } = require('../../constants');
const db = require('../../models');

const saveAmericasCup2016Data = async (bucketName, fileName) => {
  const XML_DIR_NAME = 'history';
  const CSV_DIR_NAME = 'csv';
  let targetDir;
  try {
    targetDir = temp.mkdirSync('americascup_rawdata');
    await downloadAndExtract({ s3, bucketName, fileName, targetDir });

    const existingRacesInDB = await db.americascupRace.findAll({
      attributes: ['original_id']
    }).then((races) => races.map((r) => r.original_id));

    const dirName = listDirectories(targetDir)[0];
    const dirPath = path.join(targetDir, dirName);

    const regattaNames = listDirectories(dirPath);
    for (regattaName of regattaNames) {
    // for (regattaName of [regattaNames[6], regattaNames[7], regattaNames[8], regattaNames[9]]) {
      const existingRaceIds = [];
      const regattaPath = path.join(dirPath, regattaName);
      const dayDirNames = listDirectories(regattaPath);
      let regattaData;
      for (dayDirName of dayDirNames) {
        const xmlPath = path.join(regattaPath, dayDirName, XML_DIR_NAME);
        const xmlFiles = fs.readdirSync(xmlPath);

        if (!regattaData) {
          const regattaFileName = xmlFiles.find((n) => n.indexOf('regatta') > -1);
          const regattaFilePath = path.join(xmlPath, regattaFileName);
          const regattaJson = _mapRegattaData(regattaFilePath);
          if (regattaJson) {
            regattaData = regattaJson;
          }
        }

        const csvPath = path.join(regattaPath, dayDirName, CSV_DIR_NAME);
        const csvFileNames = fs.readdirSync(csvPath);
        const raceFileNames = xmlFiles.filter((n) => n.split('_')[1] === 'race.xml');

        for (raceFileName of raceFileNames) {
          const objectsToSave = {};
          const raceFilePath = path.join(xmlPath, raceFileName);
          const fileTimestamp = raceFileName.split('_')[0];
          let raceId, raceOriginalId;
          try {
            const rawRaceJson = readXmlFileToJson(raceFilePath);
            raceOriginalId = rawRaceJson.Race?.RaceID;
            if (raceOriginalId && existingRacesInDB.includes(raceOriginalId)) {
              console.log(`Race id ${raceOriginalId} already saved in database. Skipping`);
              continue;
            }
            const existingRace = existingRaceIds.find((race) => race.original_id === raceOriginalId);
            if (existingRace) {
              raceId = existingRace.id;
              // There are mutliple race.xml that have the same info except course limits so skip other data
              objectsToSave.AmericasCupCourseLimit = _mapRaceCourseLimitData(rawRaceJson, existingRace.id, existingRace.original_id);
            } else {
              objectsToSave.AmericasCupRegatta = regattaData;
              const raceMapping = _mapRaceData(rawRaceJson, objectsToSave.AmericasCupRegatta.id, objectsToSave.AmericasCupRegatta.original_id);
              objectsToSave.AmericasCupRace = raceMapping.race;
              objectsToSave.AmericasCupCompoundMark = raceMapping.compoundMarks;
              objectsToSave.AmericasCupMark = raceMapping.marks;
              objectsToSave.AmericasCupCourseLimit = raceMapping.courseLimits;

              raceId = objectsToSave.AmericasCupRace.id;
              existingRaceIds.push({
                id: objectsToSave.AmericasCupRace.id,
                original_id: objectsToSave.AmericasCupRace.original_id,
              });
            }

            // Map Boat Data
            const boatFilePath = path.join(xmlPath, `${fileTimestamp}_boats.xml`);
            const boatRawJson = readXmlFileToJson(boatFilePath);
            if (boatRawJson) {
              const boatMapping = _mapBoatData(boatRawJson);
              objectsToSave.AmericasCupBoat = boatMapping.boats;
              objectsToSave.AmericasCupBoatShape = boatMapping.boatShapes;
            }

            // Map Average Wind Data
            const avgWindData = await _mapAvgWindData(csvPath, csvFileNames, fileTimestamp, raceId, raceOriginalId);
            if (avgWindData && avgWindData.length) {
              objectsToSave.AmericasCupAvgWind = avgWindData;
            }

            // Map Events
            const eventData = await _mapEventsData(csvPath, csvFileNames, fileTimestamp, raceId, raceOriginalId, objectsToSave.AmericasCupBoat);
            if (eventData && eventData.length) {
              objectsToSave.AmericasCupEvent = eventData;
            }

            // Map Positions
            const positionData = await _mapPositionsData(csvPath, csvFileNames, fileTimestamp, raceId, raceOriginalId, objectsToSave.AmericasCupBoat);
            if (positionData && positionData.length) {
              objectsToSave.AmericasCupPosition = positionData;
            }

            console.log(`Saving race with timestamp ${fileTimestamp}`);
            const transaction = await db.sequelize.transaction();
            try {
              for (suffix of AMERICAS_CUP_TABLE_SUFFIX) {
                const dataToSave = objectsToSave[`AmericasCup${suffix}`];
                if (dataToSave) {
                  const clonedData = [].concat(dataToSave);
                  while (clonedData.length > 0) {
                    const splicedArray = clonedData.splice(0, SAVE_DB_POSITION_CHUNK_COUNT);
                    await db[`americascup${suffix}`].bulkCreate(splicedArray, {
                      ignoreDuplicates: true,
                      validate: true,
                      transaction,
                    });
                  }
                }
              }

              await transaction.commit();
            } catch (err) {
              await transaction.rollback();
              console.log(`Bulk saving failed for file timestamp ${fileTimestamp}`, err);
            }
          } catch (err) {
            console.log(`Failed processing race with file timestamp ${fileTimestamp}`, err);
          }
        }
      }
    }
  } catch (err) {
    console.log('An error occured', err);
  } finally {
    temp.cleanupSync();
  }
};

const _mapRegattaData = (regattaFilePath) => {
  const rawRegattaJson = readXmlFileToJson(regattaFilePath);
  if (rawRegattaJson) {
    return {
      id: uuidv4(),
      original_id: rawRegattaJson.RegattaConfig.RegattaID,
      name: rawRegattaJson.RegattaConfig.RegattaName,
      course_name: rawRegattaJson.RegattaConfig.CourseName,
      central_lat: rawRegattaJson.RegattaConfig.CentralLatitude,
      central_lon: rawRegattaJson.RegattaConfig.CentralLongitude,
      central_altitude: rawRegattaJson.RegattaConfig.CentralAltitude,
      utc_offset: rawRegattaJson.RegattaConfig.UtcOffset,
      magnetic_variation: rawRegattaJson.RegattaConfig.MagneticVariation,
      shoreline_name: rawRegattaJson.RegattaConfig.ShorelineName,
    };
  }
  return;
}

const _mapBoatData = (rawJson) => {
  const boatShapes = [];
  rawJson.BoatConfig?.BoatShapes?.BoatShape?.forEach((shape) => {
    const rawVtx = [].concat(shape.Vertices.Vtx);
    rawVtx.forEach((vtx) => {
      boatShapes.push({
        id: uuidv4(),
        original_id: shape.ShapeID,
        seq: vtx.Seq,
        y: vtx.Y,
        x: vtx.X,
      })
    });
  });

  const boats = rawJson.BoatConfig?.Boats?.Boat?.map((boat) => ({
    id: uuidv4(),
    original_id: boat.SourceID,
    shape_original_id: boat.ShapeID,
    type: boat.Type,
    ack: boat.Ack,
    ip_address: boat.IPAddress,
    stowe_name: boat.StoweName,
    short_name: boat.ShortName,
    shorter_name: boat.ShorterName,
    boat_name: boat.BoatName,
    hull_num: boat.HullNum,
    skipper: boat.Skipper,
    flag: boat.Flag,
    peli_id: boat.PeliID,
    radio_ip: boat.RadioIP,
  }));

  return {
    boatShapes,
    boats,
  };
};

const _mapRaceData = (rawJson, regattaId, regattaOriginalId) => {
  const race = {
    id: uuidv4(),
    original_id: rawJson.Race.RaceID,
    name: 'Day ' + rawJson.Race.RaceID.charAt(rawJson.Race.RaceID.length - 1),
    type: rawJson.Race.RaceType,
    start_time: rawJson.Race.RaceStartTime.Start,
    postpone: rawJson.Race.RaceStartTime.Postpone,
    creation_time_date: rawJson.Race.CreationTimeDate,
    regatta: regattaId,
    regatta_original_id: regattaOriginalId,
    participants: rawJson.Race.Participants.Yacht.map((p) => p.SourceID),
  };

  const compoundMarks = [];
  const marks = [];
  rawJson.Race.Course.CompoundMark.forEach((cm) => {
    const markSequence = rawJson.Race?.CompoundMarkSequence?.Corner?.find((s) => s.SeqID === cm.CompoundMarkID);
    const compoundMarkId = uuidv4();
    compoundMarks.push({
      id: compoundMarkId,
      original_id: cm.CompoundMarkID,
      seq_id: markSequence?.SeqID,
      name: cm.Name,
      race: race.id,
      race_original_id: race.original_id,
      rounding: markSequence?.Rounding,
      zone_size: markSequence?.ZoneSize,
    });

    const rawMarks = [].concat(cm.Mark);
    rawMarks.forEach((m) => {
      marks.push({
        id: uuidv4(),
        original_id: m.SourceID,
        race: race.id,
        race_original_id: race.original_id,
        compound_mark: compoundMarkId,
        compound_mark_original_id: cm.CompoundMarkID,
        seq_id: m.SeqID,
        name: m.Name,
        lat: m.TargetLat,
        lon: m.TargetLng,
      });
    });
  });

  const courseLimits = _mapRaceCourseLimitData(rawJson, race.id, race.original_id);

  return {
    race,
    compoundMarks,
    marks,
    courseLimits,
  }
};

const _mapRaceCourseLimitData = (rawJson, raceId, raceOriginalId) => {
  return rawJson.Race?.CourseLimit?.Limit?.map((cl) => ({
    id: uuidv4(),
    seq_id: cl.SeqID,
    race: raceId,
    race_original_id: raceOriginalId,
    lat: cl.Lat,
    lon: cl.Lon,
    time_created: rawJson.Race.CreationTimeDate,
  }))
};

const _mapAvgWindData = async (csvPath, csvFileNames, fileTimestamp, raceId, raceOriginalId) => {
  const avgWindFileName = `${fileTimestamp}_avg_wind.csv`;
  if (csvFileNames.includes(avgWindFileName)) {
    const avgWindFilePath = path.join(csvPath, avgWindFileName);
    const avgWindJson = await readCsvFileToJson(avgWindFilePath);
    return avgWindJson.map((wind) => ({
      id: uuidv4(),
      race: raceId,
      race_original_id: raceOriginalId,
      date: wind.Date,
      secs: wind.Secs,
      local_time: wind.LocalTime,
      zone: wind.Zone,
      instant: wind.Instant,
      average: wind.Average,
    }));
  }
  return;
}

const _mapEventsData = async (csvPath, csvFileNames, fileTimestamp, raceId, raceOriginalId, boats) => {
  const eventsFileName = `${fileTimestamp}_events.csv`;
  if (csvFileNames.includes(eventsFileName)) {
    const eventsFilePath = path.join(csvPath, eventsFileName);
    const eventsJson = await readCsvFileToJson(eventsFilePath);
    return eventsJson.map((event) => ({
      id: uuidv4(),
      race: raceId,
      race_original_id: raceOriginalId,
      boat_name: event.Boat,
      boat: boats.find((b) => b.stowe_name === event.Boat)?.id || '',
      boat_original_id: boats.find((b) => b.stowe_name === event.Boat)?.original_id || '',
      date: event.Date,
      secs: event.Secs,
      local_time: event.LocalTime,
      zone: event.Zone,
      event: event.Event,
      opt1: event.Opt1,
      opt2: event.Opt2,
    }));
  }
  return;
}

const _mapPositionsData = async (csvPath, csvFileNames, fileTimestamp, raceId, raceOriginalId, boats) => {
  const positionFileNamePrefix = `${fileTimestamp}-NAV-`;
  const positionFileNames = csvFileNames.filter((n) => n.indexOf(positionFileNamePrefix) === 0);
  const allPositionJson = [];
  for (positionFileName of positionFileNames) {
    const positionFilePath = path.join(csvPath, positionFileName);
    const positionJson = await readCsvFileToJson(positionFilePath);
    const mappedPositionJson = positionJson.map((pos) => ({
      id: uuidv4(),
      race: raceId,
      race_original_id: raceOriginalId,
      boat_name: pos.Boat,
      boat: boats.find((b) => b.stowe_name === pos.Boat)?.id || '',
      boat_original_id: boats.find((b) => b.stowe_name === pos.Boat)?.original_id || '',
      date: pos.Date,
      secs: pos.Secs,
      zone: pos.Zone,
      lat: pos.Lat,
      lon: pos.Lon,
      hdg: pos.Hdg,
      heel: pos.Heel,
      pitch: pos.Pitch,
      cog: pos.COG,
      sog: pos.SOG,
      course_wind_direction: pos.CourseWindDirection,
      course_wind_speed: pos.CourseWindSpeed,
      y_hdg: pos.yHdg,
      y_speed: pos.ySpeed,
      y_tws: pos.yTWS,
      y_twd: pos.yTWD,
      y_aws: pos.yAWS,
      y_awa: pos.yAWA,
      y_twa: pos.yTWA,
      y_sog: pos.ySOG,
      y_cog: pos.yCOG,
      y_rudder: pos.yRudder,
    }));
    appendArray(allPositionJson, mappedPositionJson);
  }
  return allPositionJson;
}

module.exports = saveAmericasCup2016Data;
