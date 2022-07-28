const { saveCompetitionUnit } = require('../saveCompetitionUnit');
const gisUtils = require('../../utils/gisUtils');
const { v4: uuidv4 } = require('uuid');

const mapMetasailToSyrf = async (data, raceMetadatas) => {
  if (!raceMetadatas?.length) {
    console.log(`mapMetasailToSyrf requires raceMetadatas`);
    return;
  }
  if (!data.MetasailRace?.length) {
    console.log(`mapMetasailToSyrf requires MetasailRace`);
    return;
  }
  // event
  const event = data.MetasailEvent?.map((e) => {
    return {
      id: e.id,
      original_id: e.original_id,
      name: e.name,
      description: [e.category_text, e.external_website]
        .filter(Boolean)
        .join('\n'),
      url: e.url,
      approxStartTimeMs: e.start * 1000,
      approxEndTimeMs: e.end * 1000,
    };
  })[0];

  const savedCompetitionUnits = [];
  for (const race of data.MetasailRace) {
    const raceMetadata = raceMetadatas.find((t) => t.id === race.id);
    if (!raceMetadata) {
      console.log(`raceMetadata is not found for ${race.original_id}`);
      return;
    }

    console.log('Saving to main database');
    const inputBoats = _mapBoats(data.MetasailBoat, race);

    if (!inputBoats.length) {
      console.log(
        `inputBoats positions is not found for  race = ${race.original_id}`,
      );
      continue;
    }
    const { courseSequencedGeometries, markTrackers, buoyPositions } =
      _mapSequencedGeometries(
        data.MetasailBuoy,
        data.MetasailGate,
        data.MetasailPosition,
        race,
      );
    const boatPositions = _mapPositions(data.MetasailPosition, race);

    if (!boatPositions.length) {
      console.log(`positions not found for race = ${race.original_id}`);
      continue;
    }

    const cu = await saveCompetitionUnit({
      event,
      race: {
        id: race.id,
        original_id: race.original_id,
        name: race.name,
        url: race.url,
        scrapedUrl: race.url,
      },
      boats: inputBoats,
      positions: boatPositions,
      raceMetadata,
      courseSequencedGeometries,
      markTrackers,
      markTrackerPositions: buoyPositions,
      reuse: {
        boats: true,
        event: true,
      },
    });
    savedCompetitionUnits.push(cu);
  }
  return savedCompetitionUnits;
};

const _mapBoats = (boats = [], race) => {
  return boats
    .filter((t) => t.race_original_id === race.original_id)
    .map((b) => {
      const vessel = {
        id: b.id,
        publicName: b.name,
        globalId: b.sail_number,
        sailNumber: b.sail_number,
        vesselId: `${b.original_id}|${b.serial}|${b.sail_number}`,
        model: b.class_name,
      };
      return vessel;
    });
};

const _mapPositions = (metasailPosition, race) => {
  if (!metasailPosition) {
    return [];
  }
  const positions = metasailPosition.filter(
    (t) => t.race_original_id === race.original_id && t.boat_original_id,
  );
  return positions
    .map((t) => {
      return {
        ...t,
        vesselId: t.boat,
        heading: t.orientation,
        sog: t.speed,
        windDirection: t.wind_direction,
        timestamp: +t.time * 1000,
        vmc: +t.vmc,
        vmg: +t.vmg,
      };
    })
    .sort((a, b) => a.timestamp - b.timestamp);
};

const _mapSequencedGeometries = (
  metasailBuoy = [],
  metasailGate = [],
  racePositions = [],
  race,
) => {
  const markTrackers = [];
  const buoyIdToMarkTrackerMap = {};
  metasailBuoy = metasailBuoy
    .filter((t) => t.race_original_id === race.original_id)
    .map((t) => {
      const id = uuidv4();
      buoyIdToMarkTrackerMap[t.id] = id;
      markTrackers.push({ id, name: t.name });
      return { ...t, markTrackerId: id };
    });

  const buoyPositions = racePositions
    .filter(
      (t) => t.buoy_original_id && t.race_original_id === race.original_id,
    )
    .map((t) => {
      return {
        ...t,
        markTrackerId: buoyIdToMarkTrackerMap[t.buoy],
        timestamp: +t.time * 1000,
      };
    })
    .sort((a, b) => a.timestamp - b.timestamp);

  const courseSequencedGeometries = [];
  let order = 1;
  metasailGate = metasailGate.filter(
    (t) => t.race_original_id === race.original_id,
  );
  for (const gate of metasailGate) {
    const buoy1FirstPosition = _findBuoyFirstPosition(
      gate.buoy_1,
      buoyPositions,
    );
    const buoy2FirstPosition = _findBuoyFirstPosition(
      gate.buoy_2,
      buoyPositions,
    );
    const buoy1 = metasailBuoy.find((t) => t.id === gate.buoy_1);
    const buoy2 = metasailBuoy.find((t) => t.id === gate.buoy_2);

    if (!buoy1 || !buoy2) {
      continue;
    }
    buoy1.used = true;
    buoy2.used = true;
    const name = [buoy1.name, buoy2.name].filter((t) => t).join(' - ');
    courseSequencedGeometries.push({
      ...gisUtils.createGeometryLine(
        {
          lat: +buoy1.lat || +buoy1FirstPosition.lat,
          lon: +buoy1.lon || +buoy1FirstPosition.lon,
          markTrackerId: buoy1.markTrackerId,
        },
        {
          lat: +buoy2.lat || +buoy2FirstPosition.lat,
          lon: +buoy2.lon || +buoy2FirstPosition.lon,
          markTrackerId: buoy2.markTrackerId,
        },
        {
          name,
        },
      ),
      order: gate.order || order,
    });
    order++;
  }

  for (const buoy of metasailBuoy) {
    if (buoy.used) {
      continue;
    }
    const firstPosition = _findBuoyFirstPosition(buoy.id, buoyPositions);
    courseSequencedGeometries.push({
      ...gisUtils.createGeometryPoint({
        lat: buoy.lat || firstPosition?.lat,
        lon: buoy.lon || firstPosition?.lon,
        properties: {
          name: buoy.name,
        },
        markTrackerId: buoy.markTrackerId,
      }),
      order: buoy.order || order,
    });
    order++;
  }
  return {
    markTrackers,
    courseSequencedGeometries,
    buoyPositions,
  };
};
const _findBuoyFirstPosition = (id, buoyPositions) => {
  const position = buoyPositions.find((t) => t.buoy === id);
  return position;
};

module.exports = mapMetasailToSyrf;
