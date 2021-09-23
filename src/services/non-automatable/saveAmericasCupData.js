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
const { normalizeRace } = require('../normalization/non-automatable/normalizeAmericascup');

const saveAmericasCupData = async (bucketName, fileName, year) => {
  const XML_DIR_NAME = 'history';
  const CSV_DIR_NAME = 'csv';
  try {
    console.log(`Downloading file ${fileName} from s3`);
    targetDir = temp.mkdirSync('americascup_rawdata');
    await downloadAndExtract({ s3, bucketName, fileName, targetDir });

    const existingRacesInDB = await db.americasCupRace.findAll({
      attributes: ['original_id']
    }).then((races) => races.map((r) => r.original_id.toString()));

    const dirName = listDirectories(targetDir)[0];
    const dirPath = path.join(targetDir, dirName);

    const regattaNames = listDirectories(dirPath);
    for (const regattaName of regattaNames) {
      console.log('Processing regatta directory', regattaName);
      const regattaPath = path.join(dirPath, regattaName);
      const dayDirNames = listDirectories(regattaPath);
      let regattaData;
      for (const dayDirName of dayDirNames) {
        console.log('Processing day directory', dayDirName);
        const xmlPath = path.join(regattaPath, dayDirName, XML_DIR_NAME);
        if (!fs.existsSync(xmlPath)) {
          continue;
        }
        const xmlFiles = fs.readdirSync(xmlPath);

        if (!regattaData) {
          const regattaFileName = xmlFiles.find((n) => n.indexOf('regatta') > -1);
          const regattaFilePath = path.join(xmlPath, regattaFileName);
          const regattaJson = await _mapRegattaData(regattaFilePath);
          if (regattaJson) {
            regattaData = regattaJson;
          }
        }

        const raceFileNames = xmlFiles.filter((n) => n.split('_')[1] === 'race.xml');
        for (const raceFileName of raceFileNames) {
          const objectsToSave = {};
          const raceFilePath = path.join(xmlPath, raceFileName);
          const fileTimestamp = raceFileName.split('_')[0];
          try {
            let raceOriginalId;
            const rawRaceJson = await readXmlFileToJson(raceFilePath);
            raceOriginalId = rawRaceJson.Race?.RaceID;
            if (raceOriginalId && existingRacesInDB.includes(raceOriginalId)) {
              console.log(`Race id ${raceOriginalId} already saved in database. Skipping`);
              continue;
            }
            objectsToSave.AmericasCupRegatta = regattaData;
            const raceMapping = _mapRaceData(rawRaceJson, objectsToSave.AmericasCupRegatta.id, objectsToSave.AmericasCupRegatta.original_id);
            objectsToSave.AmericasCupRace = raceMapping.race;
            objectsToSave.AmericasCupCompoundMark = raceMapping.compoundMarks;
            objectsToSave.AmericasCupMark = raceMapping.marks;
            objectsToSave.AmericasCupCourseLimit = raceMapping.courseLimits;

            // Map Boat Data
            const boatFilePath = path.join(xmlPath, `${fileTimestamp}_boats.xml`);
            const boatRawJson = await readXmlFileToJson(boatFilePath);
            if (boatRawJson) {
              const boatMapping = _mapBoatData(boatRawJson, year);
              objectsToSave.AmericasCupBoat = boatMapping.boats;
              objectsToSave.AmericasCupBoatShape = boatMapping.boatShapes;
            }

            await _saveToDatabase(objectsToSave);
          } catch (err) {
            console.log(`Failed processing race with file timestamp ${fileTimestamp}`, err);
          }
        }

        const csvPath = path.join(regattaPath, dayDirName, CSV_DIR_NAME);
        if (!fs.existsSync(csvPath)) {
          continue;
        }
        const csvFileNames = fs.readdirSync(csvPath);
        const eventCsvFileNames = csvFileNames.filter((n) => n.split('_')[1] === 'events.csv');
        const boats = await db.americasCupBoat.findAll({
          where: {
            year,
          },
          raw: true,
        });
        for (const eventFileName of eventCsvFileNames) {
          const objectsToSave = {};
          try {
            const fileTimestamp = eventFileName.split('_')[0];
            const eventList = await _mapEventsData(csvPath, eventFileName);
            if (!eventList?.length) {
              console.log(`No event or already saved in database for filename ${eventFileName}. Skipping.`);
              continue;
            }
            objectsToSave.AmericasCupEvent = eventList;

            const avgWindData = await _mapAvgWindData(csvPath, csvFileNames, fileTimestamp);
            if (avgWindData?.length) {
              objectsToSave.AmericasCupAvgWind = avgWindData;
            }

            const transaction = await db.sequelize.transaction();
            try {
              await _mapAndSavePositionsData(csvPath, csvFileNames, fileTimestamp, boats, transaction);

              await _saveToDatabase(objectsToSave, transaction);
              await transaction.commit();
            } catch (err) {
              console.log('Failed bulk saving', err)
              await transaction.rollback();
            }
          } catch (err) {
            console.log(`Failed processing event csv file ${eventFileName}`, err);
          }
        }
      }

      // The normalization is per regatta since the position file is not per race. Need all data saved first to be complete
      if (regattaData) {
        await _normalizeRaces(regattaData, year);
      }
    }
    console.log('Finished saving all regattas');
  } catch (err) {
    console.log('An error occured', err);
  } finally {
    temp.cleanupSync();
  }
};

const _mapRegattaData = async (regattaFilePath) => {
  const rawRegattaJson = await readXmlFileToJson(regattaFilePath);
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

const _mapBoatData = (rawJson, year) => {
  const boatShapes = [];
  rawJson.BoatConfig?.BoatShapes?.BoatShape?.forEach((shape) => {
    Object.keys(shape).forEach((key) => {
      if (shape[key].Vtx) {
        const rawVtx = [].concat(shape[key].Vtx);
        rawVtx.forEach((vtx) => {
          boatShapes.push({
            id: uuidv4(),
            original_id: shape.ShapeID,
            year,
            part: key,
            seq: vtx?.Seq,
            y: vtx.Y,
            x: vtx.X,
          })
        });
      }
    });
  });

  const boats = rawJson.BoatConfig?.Boats?.Boat?.map((boat) => ({
    id: uuidv4(),
    original_id: boat.SourceID,
    year,
    shape_original_id: boat.ShapeID,
    type: boat.Type,
    ack: boat.Ack,
    ip_address: boat.IPAddress,
    stowe_name: boat.StoweName?.trim(),
    short_name: boat.ShortName?.trim(),
    shorter_name: boat.ShorterName?.trim(),
    boat_name: boat.BoatName?.trim(),
    hull_num: boat.HullNum,
    skipper: boat.Skipper?.trim(),
    flag: boat.Flag,
    peli_id: boat.PeliID,
    radio_ip: boat.RadioIP,
    model: rawJson.BoatConfig?.Settings?.RaceBoatType?.Type,
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
    start_time: rawJson.Race.RaceStartTime?.Start,
    postpone: rawJson.Race.RaceStartTime?.Postpone,
    creation_time_date: rawJson.Race?.CreationTimeDate,
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
      name: cm.Name?.trim(),
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
        name: m.Name?.trim(),
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
  let courseLimit = rawJson.Race?.CourseLimit?.Limit;
  if (courseLimit && !(courseLimit instanceof Array)) {
    courseLimit = [courseLimit];
  }
  return courseLimit?.map((cl) => ({
    id: uuidv4(),
    seq_id: cl.SeqID,
    race: raceId,
    race_original_id: raceOriginalId,
    lat: cl.Lat,
    lon: cl.Lon,
    time_created: rawJson.Race?.CreationTimeDate,
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

const _mapAndSavePositionsData = async (csvPath, csvFileNames, fileTimestamp, boats, transaction) => {
  const positionFileNamePrefix = `${fileTimestamp}-NAV-`;
  const positionFileNames = csvFileNames.filter((n) => n.indexOf(positionFileNamePrefix) === 0);
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
      const boat = boats.find((b) => b.stowe_name === pos.Boat || b.short_name === pos.Boat || b.boat_name === pos.Boat);
      if (!boat?.id) {
        console.log(`No boat found with name ${pos.Boat}`);
      }
      return {
        id: uuidv4(),
        boat_name: pos.Boat,
        boat: boat?.id || null,
        boat_original_id: boat?.original_id || null,
        boat_type: boat?.type || null,
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
    const objectsToSave = {
      "AmericasCupPosition": mappedPositionJson
    }
    await _saveToDatabase(objectsToSave, transaction);
  }
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
        const tableName = `americasCup${suffix}`;
        const excludedFields = ['id', 'original_id', 'race', 'race_original_id', 'boat', 'boat_original_id', 'compound_mark', 'compound_mark_original_id', 'part', 'seq_id', 'year'];
        const fieldsToUpdate = Object.keys(db[tableName].rawAttributes).filter((k) => !excludedFields.includes(k));
        const clonedData = [].concat(dataToSave);
        while (clonedData.length > 0) {
          const splicedArray = clonedData.splice(0, SAVE_DB_POSITION_CHUNK_COUNT);
          await db[tableName].bulkCreate(splicedArray, {
            updateOnDuplicate: fieldsToUpdate,
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

const _getRaceStartTimeMs = (race, raceEvents) => {
  let startTimeInMs;

  if (race.start_time) {
    let raceStartTime = new Date(race.start_time);
    if (raceStartTime?.toString() !== 'Invalid Date' && !isNaN(raceStartTime)) {
      startTimeInMs = raceStartTime.getTime();
    } else {  // Americas Cup 2013 has a race timestamp format of 2011-08-14Y15:00:00 (without timezone)
      let startTimeString = race.start_time.replace('Y', 'T');
      const tz = raceEvents.map((e) => e.zone).find((e) => !!e);
      if (tz) {
        startTimeString += tz + ':00';
      }
      raceStartTime = new Date(startTimeString);
      if (raceStartTime?.toString() !== 'Invalid Date' && !isNaN(raceStartTime)) {
        startTimeInMs = raceStartTime.getTime();
      }
    }
  }

  if (!startTimeInMs) {
    const lastIndexOfStart = raceEvents.map((e) => e.event === 'RaceStarted').lastIndexOf(true);
    const startEvent = raceEvents[lastIndexOfStart];
    if (!startEvent) {  // if there is no RaceStart Event try to get from RaceStartTimeAnnounce on opt1 and opt2
      // Get the last announcement to get latest time
      const lastIndexOfAnnounce = raceEvents.map((e) => e.event === 'RaceStartTimeAnnounced').lastIndexOf(true);
      const announceEvent = raceEvents[lastIndexOfAnnounce];
      if (announceEvent) {
        const dateParts = announceEvent.opt1.split(':');  // opt 1 format is dd:mm:yyyy. Eg. 06:08:2011
        const time = announceEvent.opt2;  // opt2 is hh24:mm Eg. 14:55
        const zone = announceEvent.zone;  // zone is the offset zone Eg. +02
        const dateString = `${dateParts.reverse().join('-')}T${time}:00${zone}:00`;
        startTimeInMs = new Date(dateString).getTime();
      }
    } else {
      startTimeInMs = startEvent.timestamp;
    }
  }

  return startTimeInMs;
}

const _normalizeRaces = async (regatta, year) => {
  console.log(`Normalizing races for regatta ${regatta.original_id}`);
  const races = await db.americasCupRace.findAll({
    where: {
      [Op.and]: [
        { regatta_original_id: regatta.original_id, },
        db.sequelize.literal(`id NOT IN (SELECT id FROM "ReadyAboutRaceMetadatas" WHERE SOURCE = 'AMERICASCUP')`),
      ]
    },
  });
  for (race of races) {
    const boats = await db.americasCupBoat.findAll({
      where: {
        [Op.and]: [
          { original_id: race.participants },
          { year },
        ]
      },
      raw: true,
    });

    const marks = await db.americasCupMark.findAll({
      where: {
        race: race.id,
      },
      raw: true,
    });
    const raceEvents = await db.americasCupEvent.findAll({
      where: {
        [Op.and]: [
          { race_original_id: race.original_id },
          {
            [Op.or]: [
              { event: 'RaceStarted' },
              { event: 'RaceStartTimeAnnounced' },
              { event: 'RaceTerminated' },
            ]
          }
        ]
      },
      raw: true,
    });
    if (!raceEvents?.length) {
      console.log(`No race events for race ${race.original_id}. Skipping`);
      continue;
    }

    let newStartTime = _getRaceStartTimeMs(race, raceEvents);
    if (newStartTime) {
      race.start_time = newStartTime;
      newStartTime -= (10 * 60 * 1000);  // Subtract 10mins to get positions before race start
    } else {
      console.log(`Race ${race.original_id} has no valid race start time event. Skipping`);
      continue;
    }

    const finishEvent = raceEvents.find((e) => e.event === 'RaceTerminated');
    if (!finishEvent) {
      console.log(`Race ${race.original_id} has no RaceTerminated event. Skipping`);
      continue;
    }

    const positions = await db.americasCupPosition.findAll({
      where: {
        [Op.and]: [
          {
            timestamp: { [Op.between]: [newStartTime, finishEvent.timestamp] }
          },
          {
            boat_original_id: race.participants,
          },
        ]
      },
      raw: true,
    });
    const objectsToPass = {
      AmericasCupRegatta: regatta,
      AmericasCupRace: race,
      AmericasCupBoat: boats,
      AmericasCupMarks: marks,
      AmericasCupPosition: positions,
    }
    try {
      await normalizeRace(objectsToPass);
    } catch(err) {
      console.log(`Failed in normalizing race ${race.original_id}`, err);
    }
  }
}

module.exports = saveAmericasCupData;
