jest.mock('../syrf-schema/utils/utils', () => {
  return {
    ...jest.requireActual('../syrf-schema/utils/utils'),
    createTransaction: jest.fn().mockResolvedValue({
      commit: jest.fn(),
      rollback: jest.fn(),
    }),
  };
});

// DAL Mocks
jest.mock('../syrf-schema/dataAccess/v1/calendarEvent', () => {
  const uuid = require('uuid');
  return {
    upsert: jest.fn((id, data) =>
      Promise.resolve(Object.assign({}, data, { id: id || uuid.v4() })),
    ),
    getByScrapedOriginalIdAndSource: jest.fn(() => Promise.resolve()),
  };
});
jest.mock('../syrf-schema/dataAccess/v1/vesselParticipantGroup', () => {
  return {
    upsert: jest.fn((id, data) =>
      Promise.resolve(Object.assign({}, data, id ? { id } : {})),
    ),
  };
});
jest.mock('../syrf-schema/dataAccess/v1/vessel', () => {
  return {
    bulkCreate: jest.fn((data) => Promise.resolve(data)),
    getByVesselIdAndSource: jest.fn().mockResolvedValue(null),
  };
});
jest.mock('../syrf-schema/dataAccess/v1/vesselParticipant', () => {
  const uuid = require('uuid');
  return {
    bulkCreate: jest.fn((data) =>
      Promise.resolve(data.map((d) => ({ id: uuid.v4(), ...d }))),
    ),
    addParticipant: jest.fn((data) => Promise.resolve(data)),
  };
});
jest.mock('../syrf-schema/dataAccess/v1/participant', () => {
  return {
    bulkCreate: jest.fn((data) => Promise.resolve(data)),
  };
});
jest.mock('../syrf-schema/dataAccess/v1/markTracker', () => {
  return {
    upsert: jest.fn((id, data) =>
      Promise.resolve(Object.assign({}, data, id ? { id } : {})),
    ),
  };
});
jest.mock('../syrf-schema/dataAccess/v1/course', () => {
  return {
    clearPoints: jest.fn(() => Promise.resolve(null)),
    bulkInsertPoints: jest.fn((data) => Promise.resolve(data)),
    upsert: jest.fn((id, data) =>
      Promise.resolve(Object.assign({}, data, id ? { id } : {})),
    ),
  };
});
jest.mock('../syrf-schema/dataAccess/v1/competitionUnit', () => {
  return {
    upsert: jest.fn((id, data) =>
      Promise.resolve(Object.assign({}, data, id ? { id } : {})),
    ),
  };
});
jest.mock('../syrf-schema/dataAccess/v1/vesselParticipantEvent', () => {
  return {
    bulkCreate: jest.fn((data) => Promise.resolve(data)),
  };
});
jest.mock('../syrf-schema/dataAccess/v1/vesselParticipantTrackJson', () => {
  return {
    bulkCreate: jest.fn((data) => Promise.resolve(data)),
  };
});
jest.mock('../syrf-schema/dataAccess/v1/competitionPointTrackJson', () => {
  return {
    bulkCreate: jest.fn((data) => Promise.resolve(data)),
  };
});
jest.mock('../syrf-schema/dataAccess/v1/competitionResult', () => {
  return {
    bulkCreate: jest.fn((data) => Promise.resolve(data)),
  };
});
jest.mock('../syrf-schema/dataAccess/v1/scrapedSuccessfulUrl', () => {
  return {
    create: jest.fn((data) => Promise.resolve(data)),
  };
});
jest.mock('../syrf-schema/dataAccess/v1/scrapedFailedUrl', () => {
  return {
    create: jest.fn((data) => Promise.resolve(data)),
  };
});
