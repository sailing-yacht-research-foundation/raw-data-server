const fs = require('fs');
const temp = require('temp');
const parquet = require('parquetjs-lite');

const db = require('../../models');
const Op = db.Sequelize.Op;
const {
  sapCombined,
  sapCompetitorBoatPosition,
  sapCompetitorMarkPosition,
} = require('../../schemas/parquets/sap');
const yyyymmddFormat = require('../../utils/yyyymmddFormat');
const uploadUtil = require('../../utils/uploadUtil');

const getRaces = async () => {
  const races = await db.sapRace.findAll({ raw: true });
  return races;
};
const getObjectToRaceMapping = async (tableName, raceList) => {
  const result = await db[tableName].findAll({
    where: { race_id: { [Op.in]: raceList } },
    raw: true,
  });
  const mapping = new Map();
  result.forEach((row) => {
    let currentList = mapping.get(row.race_id);
    mapping.set(row.race_id, [...(currentList || []), row]);
  });
  return mapping;
};

const getObjectToCompetitorMapping = async (tableName, competitorList) => {
  const result = await db[tableName].findAll({
    where: { competitor_id: { [Op.in]: competitorList } },
    raw: true,
  });
  const mapping = new Map();
  result.forEach((row) => {
    let currentList = mapping.get(row.competitor_id);
    mapping.set(row.competitor_id, [...(currentList || []), row]);
  });
  return mapping;
};

const processSapData = async (optionalPath) => {
  const currentDate = new Date();
  const currentYear = String(currentDate.getUTCFullYear());
  const currentMonth = String(currentDate.getUTCMonth() + 1).padStart(2, '0');
  const fullDateFormat = yyyymmddFormat(currentDate);

  let parquetPath = optionalPath
    ? optionalPath.main
    : (await temp.open('sap')).path;
  let positionPath = optionalPath
    ? optionalPath.position
    : (await temp.open('sap_pos')).path;
  let markPath = optionalPath
    ? optionalPath.mark
    : (await temp.open('sap_mark')).path;
  const races = await getRaces();
  if (races.length === 0) {
    return '';
  }

  const raceList = races.map((row) => row.id);

  const competitorsMap = await getObjectToRaceMapping(
    'sapCompetitor',
    raceList,
  );
  const marksMap = await getObjectToRaceMapping('sapMark', raceList);
  const coursesMap = await getObjectToRaceMapping('sapCourse', raceList);
  const competitorBoatMap = await getObjectToRaceMapping(
    'sapCompetitorBoat',
    raceList,
  );

  let competitorList = [];
  competitorsMap.forEach((competitor) => {
    competitorList = competitorList.concat(competitor.map((x) => x.id));
  });
  const competitorLegMap = await getObjectToCompetitorMapping(
    'sapCompetitorLeg',
    competitorList,
  );
  const competitorManeuverMap = await getObjectToCompetitorMapping(
    'sapCompetitorManeuver',
    competitorList,
  );
  const competitorMarkPassingMap = await getObjectToCompetitorMapping(
    'sapCompetitorMarkPassing',
    competitorList,
  );

  const writer = await parquet.ParquetWriter.openFile(
    sapCombined,
    parquetPath,
    {
      useDataPageV2: false,
    },
  );
  for (let i = 0; i < races.length; i++) {
    const {
      id: race_id,
      original_id: race_original_id,
      regatta,
      name,
      scoring_system,
      ranking_metric,
      boat_class,
      can_boats_of_competitors_change_per_race,
      competitor_registration_type,
      user_start_time_inference,
      control_tracking_from_start_and_finish_times,
      start_of_race_ms,
      start_of_tracking_ms,
      newest_tracking_event_ms,
      end_of_tracking_ms,
      end_of_race_ms,
      delay_to_live_ms,
    } = races[i];
    const competitors = competitorsMap.get(race_id);
    const finalCompetitors = competitors?.map((row) => {
      return Object.assign({}, row, {
        boat: competitorBoatMap.get(row.id),
        leg: competitorLegMap.get(row.id),
        maneuver: competitorManeuverMap.get(row.id),
        mark_passing: competitorMarkPassingMap.get(row.id),
      });
    });
    await writer.appendRow({
      id: race_id,
      original_id: race_original_id,
      regatta,
      name,
      scoring_system,
      ranking_metric,
      boat_class,
      can_boats_of_competitors_change_per_race,
      competitor_registration_type,
      user_start_time_inference,
      control_tracking_from_start_and_finish_times,
      start_of_race_ms,
      start_of_tracking_ms,
      newest_tracking_event_ms,
      end_of_tracking_ms,
      end_of_race_ms,
      delay_to_live_ms,
      competitors: finalCompetitors,
      courses: coursesMap.get(race_id),
      marks: marksMap.get(race_id),
    });
  }
  await writer.close();

  await createWriter(
    sapCompetitorBoatPosition,
    positionPath,
    'competitor_id',
    competitorList,
    'sapCompetitorBoatPosition',
  );
  await createWriter(
    sapCompetitorMarkPosition,
    markPath,
    'race_id',
    races,
    'americasCup2021BoatTwd',
  );

  const mainUrl = await uploadUtil.uploadFileToS3(
    parquetPath,
    `sap/year=${currentYear}/month=${currentMonth}/sap_${fullDateFormat}.parquet`,
  );
  const positionUrl = await uploadUtil.uploadFileToS3(
    positionPath,
    `sap/year=${currentYear}/month=${currentMonth}/sapPosition_${fullDateFormat}.parquet`,
  );
  const markUrl = await uploadUtil.uploadFileToS3(
    markPath,
    `sap/year=${currentYear}/month=${currentMonth}/sapMark_${fullDateFormat}.parquet`,
  );

  if (!optionalPath) {
    fs.unlink(parquetPath, (err) => {
      if (err) {
        console.log(err);
      }
    });
    fs.unlink(positionPath, (err) => {
      if (err) {
        console.log(err);
      }
    });
    fs.unlink(markPath, (err) => {
      if (err) {
        console.log(err);
      }
    });
  }

  // Delete parqueted data from DB
  const where = { id: { [Op.in]: raceList } };
  const whereRace = { race_id: { [Op.in]: raceList } };
  await db.sapRace.destroy({
    where,
  });
  await db.sapCompetitor.destroy({
    where: whereRace,
  });
  await db.sapCompetitorBoat.destroy({
    where: whereRace,
  });
  await db.sapCompetitorBoatPosition.destroy({
    where: whereRace,
  });
  await db.sapCompetitorLeg.destroy({
    where: whereRace,
  });
  await db.sapCompetitorManeuver.destroy({
    where: whereRace,
  });
  await db.sapCompetitorMarkPassing.destroy({
    where: whereRace,
  });
  await db.sapCompetitorMarkPosition.destroy({
    where: whereRace,
  });
  await db.sapCourse.destroy({
    where: whereRace,
  });
  await db.sapMark.destroy({
    where: whereRace,
  });
  await db.sapTargetTimeLeg.destroy({
    where: whereRace,
  });
  await db.sapWindSummary.destroy({
    where: whereRace,
  });

  return {
    mainUrl,
    positionUrl,
    markUrl,
  };
};

const createWriter = async (
  parquetSchema,
  parquetPath,
  baseId,
  collection,
  dbName,
) => {
  const writer = await parquet.ParquetWriter.openFile(
    parquetSchema,
    parquetPath,
    {
      useDataPageV2: false,
    },
  );
  for (let i = 0; i < collection.length; i++) {
    const id = collection[i]?.id ? collection[i].id : collection[i];
    const perPage = 50000;
    let page = 1;
    let pageSize = 0;
    do {
      const data = await db[dbName].findAll({
        where: { [baseId]: id },
        raw: true,
        offset: (page - 1) * perPage,
        limit: perPage,
      });
      pageSize = data.length;
      page++;
      while (data.length > 0) {
        await writer.appendRow(data.pop());
      }
    } while (pageSize === perPage);
  }
  await writer.close();
};
module.exports = {
  getRaces,
  getObjectToRaceMapping,
  processSapData,
};
