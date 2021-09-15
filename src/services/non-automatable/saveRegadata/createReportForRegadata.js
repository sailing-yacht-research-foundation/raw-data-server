const { v4: uuidv4 } = require('uuid');
const db = require('../../../models');
const { SAVE_DB_POSITION_CHUNK_COUNT } = require('../../../constants');

/**
 * Create report based on race and sail information
 * @param {Transaction} transaction
 * @param {Race} race
 * @param {Map of sail} map
 * @param {Document[]} reportData
 * @returns void
 */
const createReportForRegadata = async (
  transaction,
  race,
  map,
  reportData = [],
) => {
  if (!reportData || !race) {
    return;
  }
  let newReports = [];
  for (const report of reportData) {
    const id = uuidv4();
    const currentReport = {
      ...report,
      id,
      original_object_id: report._id.toString(),
      original_id: report.id,
      race_id: race.id,
      race_original_id: race.original_id,
      sail_id: map.get(report.sail),
      lat_dec: race.lat_dec || null,
      lon_dec: race.lon_dec || null,
      '1hour_heading': race['1hour_heading'] || null,
      '1hour_speed': race['1hour_speed'] || null,
      '1hour_vmg': race['1hour_vmg'] || null,
      '1hour_distance': race['1hour_distance'] || null,
      lastreport_heading: race.lastreport_heading || null,
      lastreport_speed: race.lastreport_speed || null,
      lastreport_vmg: race.lastreport_vmg || null,
      lastreport_distance: race.lastreport_distance || null,
      '24hour_heading': race['24hour_heading'] || null,
      '24hour_speed': race['24hour_speed'] || null,
      '24hour_vmg': race['24hour_vmg'] || null,
      '24hour_distance': race['24hour_distance'] || null,
      dtf: race.dtf || null,
      dtl: race.dtl || null,
      total_distance: race.total_distance || null,
      dtl_diff: race.dtl_diff || null,
      timestamp: typeof report.timestamp === 'number' ? report.timestamp : null,
    };
    newReports.push(currentReport);
  }

  while (newReports.length > 0) {
    const splicedArray = newReports.splice(0, SAVE_DB_POSITION_CHUNK_COUNT);
    await db.regadataReport.bulkCreate(splicedArray, {
      ignoreDuplicates: true,
      validate: true,
      transaction,
    });
  }
};

module.exports = createReportForRegadata;
