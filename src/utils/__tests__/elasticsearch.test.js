const axios = require('axios');
jest.unmock('../elasticsearch');
jest.mock('axios', () => ({
  create: jest.fn().mockReturnThis(),
  put: jest.fn(),
  post: jest.fn().mockReturnThis(),
}));

describe('elasticsearch.js', () => {
  let oldEnvHost;
  beforeAll(() => {
    oldEnvHost = process.env.AWS_ES_HOST;
    process.env.AWS_ES_HOST = 'http://test-elasticsearch';
  });
  afterAll(() => {
    process.env.AWS_ES_HOST = oldEnvHost;
    jest.restoreAllMocks();
  });
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('When indexRace is called', () => {
    it('should index race data', async () => {
      const { indexRace } = require('../elasticsearch');
      const raceId = 'raceid';
      const raceData = {
        id: raceId,
        name: 'test race',
      };
      const fakedResp = { id: raceId };
      axios.put.mockResolvedValueOnce(fakedResp);

      const r = await indexRace('raceid', raceData);
      expect(axios.put).toHaveBeenCalledWith(`races/_doc/${raceId}`, raceData);
      expect(r).toEqual(fakedResp);
    });

    it('should throw error in case of failure', async () => {
      const { indexRace } = require('../elasticsearch');
      const raceId = 'raceid';
      const raceData = {
        id: raceId,
        name: 'test race',
      };
      const fakedError = 'Faked error';
      axios.put.mockRejectedValueOnce(fakedError);

      try {
        await indexRace('raceid', raceData);
      } catch (err) {
        expect(err).toEqual(fakedError);
        expect(axios.put).toHaveBeenCalledWith(
          `races/_doc/${raceId}`,
          raceData,
        );
      }
    });
  });

  describe('When updateEventAndIndexRaces is called', () => {
    it('should update calendarEventId and call indexRace', async () => {
      const { updateEventAndIndexRaces } = require('../elasticsearch');
      const raceId = 'raceid';
      const raceData = {
        id: raceId,
        name: 'test race',
        calendarEventId: 'newCalendarEventId',
      };
      axios.put.mockResolvedValueOnce(raceData);
      const competitionUnits = [raceData];
      const esBodies = [
        {
          id: raceId,
          name: raceData.name,
          event: 'oldCalendarEventId',
        },
      ];
      const expectedBody = Object.assign({}, esBodies[0], {
        event: raceData.calendarEventId,
      });

      await updateEventAndIndexRaces(esBodies, competitionUnits);
      expect(axios.put).toHaveBeenCalledTimes(1);
      expect(axios.put).toHaveBeenCalledWith(
        `races/_doc/${raceId}`,
        expectedBody,
      );
    });
    it('should not call indexRace if id does not exist on competitionUnits', async () => {
      const { updateEventAndIndexRaces } = require('../elasticsearch');
      const raceId = 'raceid';
      const raceData = {
        id: raceId,
        name: 'test race',
        calendarEventId: 'newCalendarEventId',
      };
      axios.put.mockResolvedValueOnce(raceData);
      const esBodies = [
        {
          id: raceId,
          name: raceData.name,
          event: 'oldCalendarEventId',
        },
      ];

      await updateEventAndIndexRaces(esBodies, []);
      expect(axios.put).toHaveBeenCalledTimes(0);
    });
  });

  describe('When pageByIdFinishedNotSyrf is called', () => {
    it('should call api post not SYRF and isUnfinished not be true', async () => {
      const { pageByIdFinishedNotSyrf } = require('../elasticsearch');
      const size = 100;
      const searchAfter = 10;

      await pageByIdFinishedNotSyrf(searchAfter, size);
      expect(axios.post).toHaveBeenCalledTimes(1);
      expect(axios.post).toHaveBeenCalledWith(
        'races/_search',
        expect.objectContaining({
          size,
          search_after: [searchAfter],
          query: {
            bool: {
              must_not: [
                {
                  match: {
                    source: 'SYRF',
                  },
                },
                {
                  match: {
                    is_unfinished: true,
                  },
                },
              ],
            },
          },
        }),
      );
    });
  });

  describe('When deleteByIds is called', () => {
    it('should call api post with _delete_by_query', async () => {
      const { deleteByIds } = require('../elasticsearch');
      const ids = ['test-id-1', 'test-id-2'];

      await deleteByIds(ids);
      expect(axios.post).toHaveBeenCalledTimes(1);
      expect(axios.post).toHaveBeenCalledWith('races/_delete_by_query', {
        query: {
          terms: {
            _id: ids,
          },
        },
      });
    });
  });
});
