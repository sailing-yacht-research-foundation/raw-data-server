const elasticsearch = require('elasticsearch');
const { indexRace } = require('../elasticsearch');

describe('elasticsearch.js', () => {
  describe('When indexRace is called', () => {
    let elasticsearchclient, esIndexSpy;
    beforeAll(() => {
      elasticsearchclient = new elasticsearch.Client();
      esIndexSpy = jest.spyOn(elasticsearchclient, 'index');
    })
    afterEach(() => {
      jest.restoreAllMocks();
    })

    it('should index race data', async () => {
      const raceId = 'raceid';
      const raceData = {
        id: raceId,
        name: 'test race',
      };
      const fakedResp = { id: raceId };
      elasticsearchclient.index.mockImplementation((_, callback) => callback(null, fakedResp));

      const r = await indexRace('raceid', raceData);
      expect(esIndexSpy).toHaveBeenCalledWith({
        index: 'races',
        id: raceId,
        type: 'race',
        body: raceData,
      }, expect.anything());
      expect(r).toEqual(fakedResp);
    });

    it('should throw error in case of failure', async () => {
      const raceId = 'raceid';
      const raceData = {
        id: raceId,
        name: 'test race',
      };
      const fakedError = 'Faked error';
      elasticsearchclient.index.mockImplementation((_, callback) => callback(fakedError));

      try {
        await indexRace('raceid', raceData);
      } catch (err) {
        expect(err).toEqual(fakedError);
        expect(esIndexSpy).toHaveBeenCalledWith({
          index: 'races',
          id: raceId,
          type: 'race',
          body: raceData,
        }, expect.anything());
      }
    });
  });
});
