const temp = require('temp').track();

const db = require('../models');
const Op = db.Sequelize.Op;
const yyyymmddFormat = require('../utils/yyyymmddFormat');
const georacingToParquet = require('./georacingToParquet');
const uploadFileToS3 = require('./uploadFileToS3');

const processGeoracingData = async () => {
  const currentDate = new Date();
  const currentYear = String(currentDate.getUTCFullYear());
  const currentMonth = String(currentDate.getUTCMonth() + 1).padStart(2, '0');
  const fullDateFormat = yyyymmddFormat(currentDate);
  const dirPath = await temp.mkdir('rds-georacing');

  const parquetPath = `${dirPath}/georacing.parquet`;
  const events = await db.georacingEvent.findAll({ raw: true });
  const queryEventList = events.map((row) => row.id);
  const races = await db.georacingRace.findAll({
    where: { event: { [Op.in]: queryEventList } },
    raw: true,
  });
  const eventRaces = new Map();
  races.forEach((race) => {
    let currentList = eventRaces.get(race.event);
    let newData = {
      id: race.id,
      original_id: race.original_id,
      name: race.name,
      short_name: race.short_name,
      short_description: race.short_description,
      time_zone: race.time_zone,
      available_time: race.available_time,
      start_time: race.start_time,
      end_time: race.end_time,
      url: race.url,
      player_version: race.player_version,
    };
    let newList = [newData];
    if (currentList) {
      newList = [...currentList, newData];
    }
    eventRaces.set(race.event, newList);
  });

  const actors = await db.georacingActor.findAll({
    where: { event: { [Op.in]: queryEventList } },
    raw: true,
  });
  const eventActors = new Map();
  actors.forEach((actor) => {
    let currentList = eventActors.get(actor.event);
    let newData = {
      id: actor.id,
      original_id: actor.ioriginal_idd,
      race: actor.race,
      race_original_id: actor.race_original_id,
      tracker_id: actor.tracker_id,
      tracker2_id: actor.tracker2_id,
      id_provider_actor: actor.id_provider_actor,
      team_id: actor.team_id,
      profile_id: actor.profile_id,
      start_number: actor.start_number,
      first_name: actor.first_name,
      middle_name: actor.middle_name,
      last_name: actor.last_name,
      name: actor.name,
      big_name: actor.big_name,
      short_name: actor.short_name,
      members: actor.members,
      active: actor.active,
      visible: actor.visible,
      orientation_angle: actor.orientation_angle,
      start_time: actor.start_time,
      has_penality: actor.has_penality,
      sponsor_url: actor.sponsor_url,
      start_order: actor.start_order,
      rating: actor.rating,
      penality: actor.penality,
      penality_time: actor.penality_time,
      capital1: actor.capital1,
      capital2: actor.capital2,
      is_security: actor.is_security,
      full_name: actor.full_name,
      categories: actor.categories,
      categories_name: actor.categories_name,
      all_info: actor.all_info,
      nationality: actor.nationality,
      model: actor.model,
      size: actor.size,
      team: actor.team,
      type: actor.type,
      orientation_mode: actor.orientation_mode,
      id_provider_tracker: actor.id_provider_tracker,
      id_provider_tracker2: actor.id_provider_tracker2,
      states: actor.states,
      person: actor.person,
    };
    let newList = [newData];
    if (currentList) {
      newList = [...currentList, newData];
    }
    eventActors.set(actor.event, newList);
  });
  const data = events.map((row) => {
    const {
      id,
      original_id,
      name,
      short_name,
      time_zone,
      description_en,
      description_fr,
      short_description,
      start_time,
      end_time,
    } = row;
    return {
      id,
      original_id,
      name,
      short_name,
      time_zone,
      description_en,
      description_fr,
      short_description,
      start_time,
      end_time,
      races: eventRaces.get(id) || [],
      actors: eventActors.get(id) || [],
    };
  });
  await georacingToParquet(data, parquetPath);
  const fileUrl = await uploadFileToS3(
    parquetPath,
    `georacing/year=${currentYear}/month=${currentMonth}/georacing_${fullDateFormat}.parquet`,
  );
  temp.cleanup();
  return fileUrl;
};

module.exports = processGeoracingData;
