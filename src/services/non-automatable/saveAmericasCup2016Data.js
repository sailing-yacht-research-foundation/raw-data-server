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
const Op = db.Sequelize.Op;
const { normalizeRace } = require('../normalization/non-automatable/normalizeAmericascup2016');

const saveAmericasCup2016Data = async (bucketName, fileName) => {
  const XML_DIR_NAME = 'history';
  const CSV_DIR_NAME = 'csv';
  try {
    targetDir = temp.mkdirSync('americascup_rawdata');
    await downloadAndExtract({ s3, bucketName, fileName, targetDir });

    const existingRacesInDB = await db.americasCupRace.findAll({
      attributes: ['original_id']
    }).then((races) => races.map((r) => r.original_id));

    const dirName = listDirectories(targetDir)[0];
    const dirPath = path.join(targetDir, dirName);

    const regattaNames = listDirectories(dirPath);
    for (const regattaName of regattaNames) {
      console.log('Processing regatta directory', regattaName);
      const existingRaceIds = [];
      const regattaPath = path.join(dirPath, regattaName);
      const dayDirNames = listDirectories(regattaPath);
      let regattaData;
      for (const dayDirName of dayDirNames) {
        console.log('Processing day directory', dayDirName);
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

        const raceFileNames = xmlFiles.filter((n) => n.split('_')[1] === 'race.xml');
        for (const raceFileName of raceFileNames) {
          console.log('Processing race file', raceFileName);
          const objectsToSave = {};
          const raceFilePath = path.join(xmlPath, raceFileName);
          const fileTimestamp = raceFileName.split('_')[0];
          try {
            let raceId, raceOriginalId;
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

            console.log(`Saving race with timestamp ${fileTimestamp}`);
            await _saveToDatabase(objectsToSave);
          } catch (err) {
            console.log(`Failed processing race with file timestamp ${fileTimestamp}`, err);
          }
        }

        const csvPath = path.join(regattaPath, dayDirName, CSV_DIR_NAME);
        const csvFileNames = fs.readdirSync(csvPath);
        const eventCsvFileNames = csvFileNames.filter((n) => n.split('_')[1] === 'events.csv');
        const boats = await db.americasCupBoat.findAll({
          raw: true,
        });
        for (const eventFileName of eventCsvFileNames) {
          console.log(`Processing event file ${eventFileName}`);
          const objectsToSave = {};
          try {
            const fileTimestamp = eventFileName.split('_')[0];
            const eventList = await _mapEventsData(csvPath, eventFileName);
            if (!eventList?.length) {
              console.log('No event or already saved in database. Skipping.');
              continue;
            }
            objectsToSave.AmericasCupEvent = eventList;

            const avgWindData = await _mapAvgWindData(csvPath, csvFileNames, fileTimestamp);
            if (avgWindData?.length) {
              objectsToSave.AmericasCupAvgWind = avgWindData;
            }

            const positionData = await _mapPositionsData(csvPath, csvFileNames, fileTimestamp, boats);
            if (positionData?.length) {
              objectsToSave.AmericasCupPosition = positionData;
            }

            try {
              console.log(`Saving event with timestamp ${fileTimestamp}`);
              await _saveToDatabase(objectsToSave);
            } catch (err) {
              console.log('Failed bulk saving', err)
            }
            console.log('Finished saving');
          } catch (err) {
            console.log(`Failed processing event csv file ${eventFileName}`, err);
          }
        }
      }

      // The normalization is per regatta since the position file is not per race. Need all data saved first to be complete
      await _normalizeRaces(regattaData);
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
  let name = '';
  try {
    const dayNo = parseInt(rawJson.Race.RaceID.substr(rawJson.Race.RaceID.length - 2)); // ParseInt to remove leading 0
    name = `Race ${dayNo}`;
  } catch(err) {
    console.log('Cannot get race name', err);
  }
  const race = {
    id: uuidv4(),
    original_id: rawJson.Race.RaceID,
    name,
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

const _mapAvgWindData = async (csvPath, csvFileNames, fileTimestamp) => {
  const avgWindFileName = `${fileTimestamp}_avg_wind.csv`;
  const avgWindInDB = await db.americasCupAvgWind.findOne({
    where: {
      filename: avgWindFileName,
    },
    raw: true,
  });
  if (!avgWindInDB && csvFileNames.includes(avgWindFileName)) {
    const avgWindFilePath = path.join(csvPath, avgWindFileName);
    const avgWindJson = await readCsvFileToJson(avgWindFilePath);
    return avgWindJson.map((wind) => ({
      id: uuidv4(),
      date: wind.Date,
      secs: wind.Secs,
      local_time: wind.LocalTime,
      zone: wind.Zone,
      timestamp: _getMilliSecsFromLocalTime(wind.Date, wind.Secs, wind.Zone),
      instant: wind.Instant,
      average: wind.Average,
      filename: avgWindFileName,
    }));
  }
  return;
}

const _mapEventsData = async (csvPath, eventFileName) => {
  const eventInDB = await db.americasCupEvent.findOne({
    where: {
      filename: eventFileName,
    },
    raw: true,
  });
  if (eventInDB) {
    return;
  }
  const eventsFilePath = path.join(csvPath, eventFileName);
  const eventsJson = await readCsvFileToJson(eventsFilePath);
  return eventsJson.map((event) => ({
    id: uuidv4(),
    race_original_id: event.Race,
    boat_name: event.Boat,
    date: event.Date,
    secs: event.Secs,
    local_time: event.LocalTime,
    zone: event.Zone,
    timestamp: _getMilliSecsFromLocalTime(event.Date, event.Secs, event.Zone),
    event: event.Event,
    opt1: event.Opt1,
    opt2: event.Opt2,
    filename: eventFileName,
  }));
}

const _mapPositionsData = async (csvPath, csvFileNames, fileTimestamp, boats) => {
  const positionFileNamePrefix = `${fileTimestamp}-NAV-`;
  const positionFileNames = csvFileNames.filter((n) => n.indexOf(positionFileNamePrefix) === 0);
  const allPositionJson = [];
  for (positionFileName of positionFileNames) {
    const posInDB = await db.americasCupPosition.findOne({
      where: {
        filename: positionFileName,
      },
      raw: true,
    });
    if (posInDB) {
      continue;
    }
    const positionFilePath = path.join(csvPath, positionFileName);
    const positionJson = await readCsvFileToJson(positionFilePath);
    const mappedPositionJson = positionJson.map((pos) => {
      const boat = boats.find((b) => b.stowe_name === pos.Boat);
      return {
        id: uuidv4(),
        boat_name: pos.Boat,
        boat: boat?.id || '',
        boat_original_id: boat?.original_id || '',
        boat_type: boat?.type || '',
        date: pos.Date,
        secs: pos.Secs,
        local_time: pos.LocalTime,
        zone: pos.Zone,
        timestamp: _getMilliSecsFromLocalTime(pos.Date, pos.Secs, pos.Zone),
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
        filename: positionFileName,
      }
    });
    appendArray(allPositionJson, mappedPositionJson);
  }
  return allPositionJson;
}

const _saveToDatabase = async(objectsToSave, transaction) => {
  const transactionGiven = !!transaction;
  if (!transactionGiven) {
    transaction = await db.sequelize.transaction();
  }
  try {
    for (const suffix of AMERICAS_CUP_TABLE_SUFFIX) {
      const dataToSave = objectsToSave[`AmericasCup${suffix}`];
      if (dataToSave) {
        const clonedData = [].concat(dataToSave);
        while (clonedData.length > 0) {
          const splicedArray = clonedData.splice(0, SAVE_DB_POSITION_CHUNK_COUNT);
          await db[`americasCup${suffix}`].bulkCreate(splicedArray, {
            ignoreDuplicates: true,
            validate: true,
            transaction,
          });
        }
      }
    }
    if (!transactionGiven) {
      await transaction.commit();
    }
  } catch (err) {
    if (!transactionGiven) {
      await transaction.rollback();
    }
    throw err;
  }
}

const _getMilliSecsFromLocalTime = (dateStr, secs, zone) => {
  const dateParts = dateStr.split(':'); // sample date 26:02:2016 = Feb 2, 2016
  const date = new Date(`${dateParts[2]}-${dateParts[1]}-${dateParts[0]}`);
  const utcSeconds = parseInt(secs) + zone * -3600;
  date.setUTCSeconds(utcSeconds);
  return date.getTime();
}

const _normalizeRaces = async (regatta) => {
  console.log(`Normalizing races for regatta ${regatta.original_id}`);
  console.log('Getting race');
  const races = await db.americasCupRace.findAll({
    where: {
      [Op.and]: [
        { regatta_original_id: regatta.original_id, },
        db.sequelize.literal("id NOT IN (SELECT id FROM ReadyAboutRaceMetadatas WHERE SOURCE = 'AMERICASCUP2016')"),
      ]
    },
  });
  for (race of races) {
    console.log(`Fetching race data for ${race.original_id}`);
    console.log('Getting boats');
    const boats = await db.americasCupBoat.findAll({
      where: {
        original_id: race.participants
      },
      raw: true,
    });
    console.log('Getting marks');
    const marks = await db.americasCupMark.findAll({
      where: {
        race: race.id,
      },
      raw: true,
    });
    console.log(`Getting events race ${race.original_id}`);
    const finishEvent = await db.americasCupEvent.findOne({
      where: {
        [Op.and]: [
          { race_original_id: race.original_id },
          { event: 'RaceTerminated' }
        ]
      },
      raw: true,
    });
    if (!finishEvent) {
      console.log('Race has no RaceTerminate event. Skipping');
      continue;
    }

    const raceStartTime = new Date(race.start_time).getTime();
    const newStartTime = raceStartTime - (10 * 60 * 1000);  // Subtract 10mins to get positions before race start
    console.log('Getting positions for participants', race.participants);
    const positions = await db.americasCupPosition.findAll({
      where: {
        [Op.and]: [
          {
            timestamp: { [Op.between]: [newStartTime, finishEvent.timestamp] }
          },
          {
            boat_original_id: race.participants
          },
        ]
      },
      raw: true,
    });
    console.log('positions.length', positions.length)

    const objectsToPass = {
      AmericasCupRegatta: regatta,
      AmericasCupRace: race,
      AmericasCupBoat: boats,
      AmericasCupMarks: marks,
      AmericasCupPosition: positions,
    }
    try {
      console.log(`Normalizing race ${race.original_id}`);
      await normalizeRace(objectsToPass);
    } catch(err) {
      console.log(`Failed in normalizing race ${race.id}`, err);
    }
  }
  console.log('Finished normalizing races');
}

module.exports = saveAmericasCup2016Data;
