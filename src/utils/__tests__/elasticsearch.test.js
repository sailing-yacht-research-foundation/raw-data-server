const sinon = require('sinon');
const elasticsearch = require('../elasticsearch');

describe('elasticsearch.js', () => {
  describe('When indexRace is called', () => {
    afterEach(() => {
      sinon.restore();
    });
    it('should index race data', async () => {
      const raceId = 'raceid';
      const raceData = {
        id: raceId,
        name: 'test race',
      };
      const fakedResp = { id: raceId };
      const indexMethod = sinon.replace(
        elasticsearch.elasticsearchclient,
        'index',
        sinon.fake.yields(null, fakedResp),
      );

      const r = await elasticsearch.indexRace('raceid', raceData);
      expect(indexMethod.callCount).toBe(1);
      expect(indexMethod.getCall(0).args[0]).toEqual({
        index: 'races',
        id: raceId,
        type: 'race',
        body: raceData,
      });
      expect(r).toEqual(fakedResp);
    });

    it('should throw error in case of failure', async () => {
      const raceId = 'raceid';
      const raceData = {
        id: raceId,
        name: 'test race',
      };
      const fakedError = 'Faked error';
      const indexMethod = sinon.replace(
        elasticsearch.elasticsearchclient,
        'index',
        sinon.fake.yields(fakedError),
      );

      try {
        await elasticsearch.indexRace('raceid', raceData);
      } catch (err) {
        expect(err).toEqual(fakedError);
        expect(indexMethod.callCount).toBe(1);
        expect(indexMethod.getCall(0).args[0]).toEqual({
          index: 'races',
          id: raceId,
          type: 'race',
          body: raceData,
        });
      }
    });
  });
});
