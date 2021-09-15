const { v4: uuidv4 } = require('uuid');
const { s3 } = require('../uploadUtil');
const fs = require('fs');
const path = require('path');
const temp = require('temp').track();
const { listDirectories } = require('../../utils/fileUtils');
const { SAVE_DB_POSITION_CHUNK_COUNT } = require('../../constants');
const db = require('../../models');

const { downloadAndExtract } = require('../../utils/unzipFile');
const {
  normalizeRace,
} = require('../normalization/non-automatable/normalizeSap');

const saveSapData = async (bucketName, fileName) => {
  try {
    let targetDir = temp.mkdirSync('sap_rawdata');
    console.log(`Downloading file ${fileName} from s3`);
    await downloadAndExtract({ s3, bucketName, fileName, targetDir });
    const dirName = listDirectories(targetDir)[0];
    const dirPath = path.join(targetDir, dirName);
    const allData = listDirectories(dirPath)[0];
    const allDataPath = path.join(dirPath, allData);
    const competitorPositionPath = path.join(
      allDataPath,
      'competitor_positions',
    );
    const entriesPath = path.join(allDataPath, 'entries');
    const racePath = path.join(allDataPath, 'races');
    const competitorLegPath = path.join(allDataPath, 'competitor_legs');
    const coursePath = path.join(allDataPath, 'course');
    const maneuverPath = path.join(allDataPath, 'maneuvers');
    const markPassingPath = path.join(allDataPath, 'mark_passings');
    const markPositionPath = path.join(allDataPath, 'mark_positions');
    const targetTimePath = path.join(allDataPath, 'targettime');
    const timePath = path.join(allDataPath, 'times');
    const windSummaryPath = path.join(allDataPath, 'wind_summary');
    const competitorPositionFiles = fs.readdirSync(competitorPositionPath);

    for (const competitorPositionFile of competitorPositionFiles) {
      const transaction = await db.sequelize.transaction();
      console.log(`Processing ${competitorPositionFile}`);
      try {
        if (competitorPositionFile.endsWith('.json')) {
          const regattaName = competitorPositionFile
            .split('race_')[0]
            .replace('regatta_', '');
          const raceName = competitorPositionFile
            .split('race_')[1]
            .replace('_competitor_positions.json', '');
          const entriesFilePath = path.join(
            entriesPath,
            `${regattaName}_entries.json`,
          );
          const competitorPositionFilePath = path.join(
            competitorPositionPath,
            competitorPositionFile,
          );
          const raceFilePath = path.join(racePath, `${regattaName}_races.json`);
          const timeFilePath = path.join(
            timePath,
            `regatta_${regattaName}race_${raceName}_times.json`,
          );
          const competitorLegFilePath = path.join(
            competitorLegPath,
            `regatta_${regattaName}race_${raceName}_competitor_legs.json`,
          );
          const maneuverFilePath = path.join(
            maneuverPath,
            `regatta_${regattaName}race_${raceName}_maneuvers.json`,
          );
          const markPassingFilePath = path.join(
            markPassingPath,
            `regatta_${regattaName}race_${raceName}_mark_passings.json`,
          );
          const markPositionFilePath = path.join(
            markPositionPath,
            `regatta_${regattaName}race_${raceName}_marks_positions.json`,
          );
          const courseFilePath = path.join(
            coursePath,
            `regatta_${regattaName}race_${raceName}_course.json`,
          );
          const targetTimeFilePath = path.join(
            targetTimePath,
            `regatta_${regattaName}race_${raceName}_targettime.json`,
          );

          const windSummaryFilePath = path.join(
            windSummaryPath,
            `${regattaName}_windsummary.json`,
          );

          //Competitor Positions
          const competitorPositionsData = JSON.parse(
            fs.readFileSync(competitorPositionFilePath),
          );
          let entriesData = {};
          let raceData = {};
          let timeData = {};
          let timeLegData = {};
          let maneuverData = {};
          let markPassingData = {};
          let markPostionData = {};
          let courseData = {};
          let targetTimeData = {};
          let windSummaryData = {};

          let competitors = [];
          let boats = [];
          let timeLegPositions = [];
          let maneuvers = [];
          let markPassings = [];
          let markPositions = [];
          let marks = [];
          let courses = [];
          let targetTimes = [];
          let windSummarys = [];
          try {
            entriesData = JSON.parse(fs.readFileSync(entriesFilePath));
            raceData = JSON.parse(fs.readFileSync(raceFilePath));
            timeData = JSON.parse(fs.readFileSync(timeFilePath));
            timeLegData = JSON.parse(fs.readFileSync(competitorLegFilePath));
            maneuverData = JSON.parse(fs.readFileSync(maneuverFilePath));
            markPassingData = JSON.parse(fs.readFileSync(markPassingFilePath));
            markPostionData = JSON.parse(fs.readFileSync(markPositionFilePath));
            courseData = JSON.parse(fs.readFileSync(courseFilePath));
            targetTimeData = JSON.parse(fs.readFileSync(targetTimeFilePath));
            windSummaryData = JSON.parse(fs.readFileSync(windSummaryFilePath));
          } catch (e) {
            console.log(
              `File ${competitorPositionFile} has some other files missing, skipping race`,
            );
            continue;
          }

          const raceInfo = raceData.races.find(
            (r) => r.name == competitorPositionsData.name,
          );
          if (!raceInfo) continue;

          const existingRace = await db.sapRace.findOne({
            where: { name: raceInfo.name },
          });
          if (existingRace) continue;
          const raceId = uuidv4();

          const existingRegatta = await db.sapRace.findOne({
            where: { regatta: regattaName.split('_20').join(' ') },
          });
          if (!existingRegatta) {
            for (const competitor of entriesData.competitors) {
              let competitorId = uuidv4();
              competitors.push({
                id: competitorId,
                original_id: competitor.id,
                regatta: competitorPositionsData.regatta,
                name: competitor.name,
                short_name: competitor.shortName,
                display_color: competitor.displayColor,
                search_tag: competitor.searchTag,
                nationality: competitor.nationality,
                nationality_iso2: competitor.nationalityISO2,
                nationality_iso3: competitor.nationalityISO3,
                flag_image_uri: competitor.flagImageUri,
                time_on_time_factor: competitor.timeOnTimeFactor,
                time_on_distance_allowance_in_seconds_per_nautical_mile:
                  competitor.timeOnDistanceAllowanceInSecondsPerNauticalMile,
              });
            }
            await db.sapCompetitor.bulkCreate(competitors, {
              ignoreDuplicates: true,
              validate: true,
              transaction,
            });
            for (const boat of entriesData.boats) {
              let boatId = uuidv4();
              boats.push({
                id: boatId,
                original_id: boat.id,
                race_id: raceId,
                race_original_id: raceInfo.id,
                race_name: competitorPositionsData.name,
                regatta: competitorPositionsData.regatta,
                name: boat.name,
                sail_number: boat.sailId,
                color: boat.color,
                boat_class_name: boat.boatClass.name,
                boat_class_typically_start_upwind:
                  boat.boatClass.typicallyStartsUpwind,
                boat_class_hull_length_in_meters:
                  boat.boatClass.hullLengthInMeters,
                boat_class_hull_beam_in_meters: boat.boatClass.hullBeamInMeters,
                boat_class_display_name: boat.boatClass.displayName,
                boat_class_icon_url: boat.boatClass.iconUrl,
              });
            }
            await db.sapCompetitorBoat.bulkCreate(boats, {
              ignoreDuplicates: true,
              validate: true,
              transaction,
            });
          } else {
            competitors = await db.sapCompetitor.findAll({
              where: { regatta: competitorPositionsData.regatta },
            });
            boats = await db.sapCompetitorBoat.findAll({
              where: { regatta: competitorPositionsData.regatta },
            });
          }

          let race = {
            id: raceId,
            original_id: raceInfo.id,
            regatta: competitorPositionsData.regatta,
            name: competitorPositionsData.name,
            scoring_system: entriesData.scoringSystem,
            ranking_metric: entriesData.rankingMetric,
            boat_class: entriesData.boatclass,
            can_boats_of_competitors_change_per_race:
              entriesData.canBoatsOfCompetitorsChangePerRace,
            competitor_registration_type:
              entriesData.competitorRegistrationType,
            user_start_time_inference: entriesData.useStartTimeInference,
            control_tracking_from_start_and_finish_times:
              entriesData.controlTrackingFromStartAndFinishTimes,
            start_of_race_ms: timeData['startOfRace-ms'],
            start_of_tracking_ms: timeData['startOfTracking-ms'],
            newest_tracking_event_ms: timeData['newestTrackingEvent-ms'],
            end_of_tracking_ms: timeData['endOfTracking-ms'],
            end_of_race_ms: timeData['endOfRace-ms'],
            delay_to_live_ms: timeData['delayToLive-ms'],
          };
          await db.sapRace.create(race, {
            validate: true,
            transaction,
          });

          let boatPositions = [];
          for (const competitor of competitorPositionsData.competitors) {
            for (const position of competitor.track) {
              let positionId = uuidv4();
              let existingCompetitor = competitors.find(
                (c) => c.name === competitor.name,
              );
              let existingBoat = boats.find(
                (b) => b.sail_number == competitor.sailNumber,
              );
              boatPositions.push({
                id: positionId,
                competitor_id: existingCompetitor.id,
                competitor_original_id: existingCompetitor.original_id,
                race_id: raceId,
                race_original_id: raceInfo.id,
                competitor_boat_id: existingBoat.id,
                competitor_boat_original_id: existingBoat.original_id,
                timepoint_ms: position['timepoint-ms'],
                lat_deg: position['lat-deg'],
                lng_deg: position['lng-deg'],
                truebearing_deg: position['truebearing-deg'],
                speed_kts: position['speed-kts'],
              });
            }
          }

          const _boatPositions = boatPositions.slice();
          while (_boatPositions.length > 0) {
            const splicedArray = _boatPositions.splice(
              0,
              SAVE_DB_POSITION_CHUNK_COUNT,
            );
            await db.sapCompetitorBoatPosition.bulkCreate(splicedArray, {
              ignoreDuplicates: true,
              validate: true,
              transaction,
            });
          }

          for (const leg of timeLegData.legs) {
            for (const legCompetitor of leg.competitors) {
              let legId = uuidv4();
              let existingCompetitor = competitors.find(
                (c) => c.original_id === legCompetitor.id,
              );
              timeLegPositions.push({
                id: legId,
                race_id: raceId,
                race_original_id: raceInfo.id,
                race_name: raceName,
                regatta: regattaName,
                competitor_id: existingCompetitor.id,
                competitor_original_id: existingCompetitor.original_id,
                from: leg.from,
                from_waypoint_id: leg.fromWaypointId,
                to: leg.to,
                to_waypoint_id: leg.toWaypointId,
                up_or_downwind_leg: leg.upOrDownwindLeg,
                average_sog_kts: legCompetitor['averageSOG-kts'],
                tacks: legCompetitor.tacks,
                jibes: legCompetitor.jibes,
                penalty_circle: legCompetitor.penaltyCircles,
                time_since_gun_ms: legCompetitor['timeSinceGun-ms'],
                distance_since_gun_m: legCompetitor['distanceSinceGun-m'],
                distance_traveled_m: legCompetitor['distanceTraveled-m'],
                distance_traveled_including_gate_start:
                  legCompetitor['distanceTraveledIncludingGateStart-m'],
                rank: legCompetitor.rank,
                gap_to_leader_s: legCompetitor['gapToLeader-s'],
                gap_to_leader_m: legCompetitor['gapToLeader-m'],
                started: legCompetitor.started,
                finished: legCompetitor.finished,
              });
            }
          }

          const _timeLegPositions = timeLegPositions.slice();
          while (_timeLegPositions.length > 0) {
            const splicedArray = _timeLegPositions.splice(
              0,
              SAVE_DB_POSITION_CHUNK_COUNT,
            );
            await db.sapCompetitorLeg.bulkCreate(splicedArray, {
              ignoreDuplicates: true,
              validate: true,
              transaction,
            });
          }
          for (const maneuverCompetitor of maneuverData.bycompetitor) {
            for (const maneuver of maneuverCompetitor.maneuvers) {
              let manueverId = uuidv4();
              let existingCompetitor = competitors.find(
                (c) => c.original_id === maneuverCompetitor.competitor,
              );
              maneuvers.push({
                id: manueverId,
                race_id: raceId,
                race_original_id: raceInfo.id,
                competitor_id: existingCompetitor.id,
                competitor_original_id: existingCompetitor.original_id,
                maneuver_type: maneuver.maneuverType,
                new_tack: maneuver.newTack,
                speed_before_in_knots: maneuver.speedBeforeInKnots,
                cog_before_in_true_degrees: maneuver.cogBeforeInTrueDegrees,
                speed_after_in_knots: maneuver.speedAfterInKnots,
                cog_after_in_true_degrees: maneuver.cogAfterInTrueDegrees,
                direction_change_in_degrees: maneuver.directionChangeInDegrees,
                max_turning_rate_in_degrees_per_second:
                  maneuver.maxTurningRateInDegreesPerSecond,
                avg_turning_rate_in_degrees_per_second:
                  maneuver.avgTurningRateInDegreesPerSecond,
                lowest_speed_in_knots: maneuver.lowestSpeedInKnots,
                mark_passing: maneuver.markPassing,
                maneuver_loss_geographical_miles:
                  maneuver.maneuverLoss?.geographicalMiles,
                maneuver_loss_sea_miles: maneuver.maneuverLoss?.seaMiles,
                maneuver_loss_nautical_miles:
                  maneuver.maneuverLoss?.nauticalMiles,
                maneuver_loss_meters: maneuver.maneuverLoss?.meters,
                maneuver_loss_kilometers: maneuver.maneuverLoss?.kilometers,
                maneuver_loss_central_angle_deg:
                  maneuver.maneuverLoss?.centralAngleDeg,
                maneuver_loss_central_angle_rad:
                  maneuver.maneuverLoss?.centralAngleRad,
                position_time_type: maneuver.positionAndTime.type,
                position_time_lat_deg: maneuver.positionAndTime.lat_deg,
                position_time_lon_deg: maneuver.positionAndTime.lon_deg,
                position_time_unixtime: maneuver.positionAndTime.unixtime,
              });
            }
          }

          const _maneuvers = maneuvers.slice();
          while (_maneuvers.length > 0) {
            const splicedArray = _maneuvers.splice(
              0,
              SAVE_DB_POSITION_CHUNK_COUNT,
            );
            await db.sapCompetitorManeuver.bulkCreate(splicedArray, {
              ignoreDuplicates: true,
              validate: true,
              transaction,
            });
          }

          for (const markPassingCompetitor of markPassingData.bycompetitor) {
            for (const markPassing of markPassingCompetitor.markpassings) {
              let markPassingId = uuidv4();
              let existingCompetitor = competitors.find(
                (c) =>
                  c.original_id ===
                  markPassingCompetitor.competitor.competitor.id,
              );
              let existingBoat = boats.find(
                (b) =>
                  b.sail_number == markPassingCompetitor.competitor.boat.sailId,
              );

              markPassings.push({
                id: markPassingId,
                race_id: raceId,
                race_original_id: raceInfo.id,
                competitor_id: existingCompetitor.id,
                competitor_original_id: existingCompetitor.original_id,
                competitor_boat_id: existingBoat.id,
                competitor_boat_original_id: existingBoat.original_id,
                waypoint_name: markPassing.waypointName,
                zero_based_waypoint_index: markPassing.zeroBasedWaypointIndex,
                time_as_millis: markPassing.timeasmillis,
                time_as_iso: markPassing.timeasiso,
              });
            }
          }

          const _markPassings = markPassings.slice();
          while (_markPassings.length > 0) {
            const splicedArray = _markPassings.splice(
              0,
              SAVE_DB_POSITION_CHUNK_COUNT,
            );
            await db.sapCompetitorMarkPassing.bulkCreate(splicedArray, {
              ignoreDuplicates: true,
              validate: true,
              transaction,
            });
          }

          for (const mark of markPostionData.marks) {
            let markId = uuidv4();
            marks.push({
              id: markId,
              original_id: mark.id,
              race_id: raceId,
              race_original_id: raceInfo.id,
              name: mark.name,
            });
            for (const markPosition of mark.track) {
              let markPositionId = uuidv4();
              markPositions.push({
                id: markPositionId,
                race_id: raceId,
                race_original_id: raceInfo.id,
                mark_id: markId,
                mark_original_id: mark.id,
                timepoint_ms: markPosition['timepoint-ms'],
                lat_deg: markPosition['lat-deg'],
                lng_deg: markPosition['lng-deg'],
              });
            }
          }
          const _marks = marks.slice();
          while (_marks.length > 0) {
            const splicedArray = _marks.splice(0, SAVE_DB_POSITION_CHUNK_COUNT);
            await db.sapMark.bulkCreate(splicedArray, {
              ignoreDuplicates: true,
              validate: true,
              transaction,
            });
          }

          const _markPositions = markPositions.slice();
          while (_markPositions.length > 0) {
            const splicedArray = _markPositions.splice(
              0,
              SAVE_DB_POSITION_CHUNK_COUNT,
            );
            await db.sapCompetitorMarkPosition.bulkCreate(splicedArray, {
              ignoreDuplicates: true,
              validate: true,
              transaction,
            });
          }

          for (const course of courseData.waypoints) {
            let courseId = uuidv4();
            courses.push({
              id: courseId,
              race_id: raceId,
              race_original_id: raceInfo.id,
              name: courseData.name,
              course_name: course.name,
              passing_instruction: course.passingInstruction,
              class: '',
              passing_instruction: '',
              short_name: '',
              left_class: '',
              left_type: '',
              right_class: '',
              right_type: '',
            });
          }

          const _courses = courses.slice();
          while (_courses.length > 0) {
            const splicedArray = _courses.splice(
              0,
              SAVE_DB_POSITION_CHUNK_COUNT,
            );
            await db.sapCourse.bulkCreate(splicedArray, {
              ignoreDuplicates: true,
              validate: true,
              transaction,
            });
          }

          for (const targetTime of targetTimeData.legs) {
            let targetTimeId = uuidv4();
            targetTimes.push({
              id: targetTimeId,
              race_id: raceId,
              race_original_id: raceInfo.id,
              duration_millis: targetTimeData.durationMillis,
              leg_start_millis: targetTime.legStartMillis,
              leg_duration_millis: targetTime.legDurationMillis,
              leg_distance_meters: targetTime.legDistanceMeters,
              leg_bearing_degrees: targetTime.legBearingDegrees,
              leg_true_wind_angle_to_leg_degrees:
                targetTime.legTrueWindAngleToLegDegrees,
              leg_type: targetTime.legType,
              timepoint: targetTime.legWind.timepoint,
              speed_in_knots: targetTime.legWind.speedinknots,
              direction: targetTime.legWind.direction,
              leg_wind_position_latitude_deg:
                targetTime.legWind.position.latitude_deg,
              leg_wind_position_longitude_deg:
                targetTime.legWind.position.longitude_deg,
            });
          }

          const _targetTimes = targetTimes.slice();
          while (_targetTimes.length > 0) {
            const splicedArray = _targetTimes.splice(
              0,
              SAVE_DB_POSITION_CHUNK_COUNT,
            );
            await db.sapTargetTimeLeg.bulkCreate(splicedArray, {
              ignoreDuplicates: true,
              validate: true,
              transaction,
            });
          }

          for (const windSummary of windSummaryData) {
            let windSummaryId = uuidv4();
            windSummarys.push({
              id: windSummaryId,
              race_id: raceId,
              race_original_id: raceInfo.id,
              race_column: windSummary.racecolumn,
              fleet: windSummary.fleet,
              true_lower_bound_wind_in_knots:
                windSummary.trueLowerboundWindInKnots,
              true_upperbound_wind_in_knots:
                windSummary.trueUppwerboundWindInKnots,
              true_wind_direction_in_degrees:
                windSummary.trueWindDirectionInDegrees,
            });
          }

          const _windSummarys = windSummarys.slice();
          while (_windSummarys.length > 0) {
            const splicedArray = _windSummarys.splice(
              0,
              SAVE_DB_POSITION_CHUNK_COUNT,
            );
            await db.sapWindSummary.bulkCreate(splicedArray, {
              ignoreDuplicates: true,
              validate: true,
              transaction,
            });
          }
          if (race) {
            let normalizeData = {
              SapRace: [race],
              SapBoat: boats,
              SapPosition: boatPositions,
            };
            await normalizeRace(normalizeData, transaction);
          }
          await transaction.commit();
          console.log(`Finished saving race ${competitorPositionFile}`);
        }
      } catch (error) {
        console.log('Error processing race', error);
        await transaction.rollback();
      }
    }
  } catch (e) {
    console.log('An error has occured', e.message);
  } finally {
    temp.cleanupSync();
  }
};

module.exports = saveSapData;
