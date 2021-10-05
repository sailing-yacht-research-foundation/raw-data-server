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
      lat_dec: report.lat_dec || null,
      lon_dec: report.lon_dec || null,
      '1hour_heading': report['1hour_heading'] || null,
      '1hour_speed': report['1hour_speed'] || null,
      '1hour_vmg': report['1hour_vmg'] || null,
      '1hour_distance': report['1hour_distance'] || null,
      lastreport_heading: report.lastreport_heading || null,
      lastreport_speed: report.lastreport_speed || null,
      lastreport_vmg: report.lastreport_vmg || null,
      lastreport_distance: report.lastreport_distance || null,
      '24hour_heading': report['24hour_heading'] || null,
      '24hour_speed': report['24hour_speed'] || null,
      '24hour_vmg': report['24hour_vmg'] || null,
      '24hour_distance': report['24hour_distance'] || null,
      dtf: report.dtf || null,
      dtl: report.dtl || null,
      total_distance: report.total_distance || null,
      dtl_diff: report.dtl_diff || null,
      timestamp: typeof report.timestamp === 'number' ? report.timestamp : null,
    };
    newReports.push(currentReport);
  }

  const allReports = newReports.concat();
  while (newReports.length > 0) {
    const splicedArray = newReports.splice(0, SAVE_DB_POSITION_CHUNK_COUNT);
    await db.regadataReport.bulkCreate(splicedArray, {
      ignoreDuplicates: true,
      validate: true,
      transaction,
    });
  }
  return allReports;
};

module.exports = createReportForRegadata;
