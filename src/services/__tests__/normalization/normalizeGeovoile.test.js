const db = require('../../../models');
const uploadUtil = require('../../uploadUtil');
const { normalizeGeovoile } = require('../../normalization/normalizeGeovoile');

const geovoileData = {
  filename: 'normalizeGeovoile',
  testData: 'geovoile-modern.json',
  raceTable: 'regadataRaces',
  source: 'GEOVOILE',
};

describe('Normalization Geovoile Test', () => {
  let createMetadataSpy, uploadGeoJsonSpy, trackGeoJsonLookupSpy;
  beforeAll(async () => {
    await db.readyAboutRaceMetadata.sync();
    await db.readyAboutTrackGeoJsonLookup.sync();
    uploadGeoJsonSpy = jest.spyOn(uploadUtil, 'uploadGeoJsonToS3');
    createMetadataSpy = jest.spyOn(db.readyAboutRaceMetadata, 'create');
    trackGeoJsonLookupSpy = jest.spyOn(
      db.readyAboutTrackGeoJsonLookup,
      'create',
    );
  });
  afterAll(async () => {
    await db.readyAboutRaceMetadata.destroy({ truncate: true });
    await db.readyAboutTrackGeoJsonLookup.destroy({ truncate: true });
    await db.sequelize.close();
    jest.restoreAllMocks();
  });
  afterEach(() => {
    jest.resetAllMocks();
  });
  it('It should upload geojson regadata to s3', async () => {
    const jsonData = require(`../../../test-files/${geovoileData.testData}`);
    const geovoileRace = jsonData.geovoileRace;
    const boats = jsonData.boats;
    const positions = [];
    const sailors = [];

    for (const boat of boats) {
      positions.push(
        ...boat.track.locations.map((location) => {
          return {
            ...location,
            boat_original_id: boat.original_id,
            boat_id: boat.id,
          };
        }),
      );
      sailors.push(...boat.sailors);
    }
    await normalizeGeovoile({
      geovoileRace: geovoileRace,
      boats,
      positions,
      sailors,
    });
    expect(createMetadataSpy).toHaveBeenCalledTimes(1);
    expect(trackGeoJsonLookupSpy).toHaveBeenCalledTimes(1);
    expect(uploadGeoJsonSpy).toHaveBeenCalledTimes(1);
    expect(uploadGeoJsonSpy).toHaveBeenCalledWith(
      jsonData.geovoileRace.id,
      expect.anything(),
      geovoileData.source,
      undefined,
    );
  });
});
