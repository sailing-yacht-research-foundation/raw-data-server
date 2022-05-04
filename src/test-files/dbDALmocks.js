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
  return {
    upsert: jest.fn((id, data) =>
      Promise.resolve(Object.assign({}, data, id ? { id } : {})),
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

// Entities Mocks
jest.mock('../syrf-schema/entities/CalendarEvent', () => () => {
  const SequelizeMock = require('sequelize-mock');
  const dbMock = new SequelizeMock();
  return dbMock.define('CalendarEvent', {});
});
jest.mock('../syrf-schema/entities/CompetitionUnit', () => () => {
  const SequelizeMock = require('sequelize-mock');
  const dbMock = new SequelizeMock();
  return dbMock.define('CompetitionUnit', {});
});
jest.mock('../syrf-schema/entities/Course', () => () => {
  const SequelizeMock = require('sequelize-mock');
  const dbMock = new SequelizeMock();
  return dbMock.define('Course', {});
});
jest.mock('../syrf-schema/entities/CoursePoint', () => () => {
  const SequelizeMock = require('sequelize-mock');
  const dbMock = new SequelizeMock();
  return dbMock.define('CoursePoint', {});
});
jest.mock('../syrf-schema/entities/UserProfile', () => () => {
  const SequelizeMock = require('sequelize-mock');
  const dbMock = new SequelizeMock();
  return dbMock.define('UserProfile', {});
});
jest.mock('../syrf-schema/entities/UserShareableInfo', () => () => {
  const SequelizeMock = require('sequelize-mock');
  const dbMock = new SequelizeMock();
  return dbMock.define('UserShareableInfo', {});
});
jest.mock('../syrf-schema/entities/Participant', () => () => {
  const SequelizeMock = require('sequelize-mock');
  const dbMock = new SequelizeMock();
  return dbMock.define('Participant', {});
});
jest.mock('../syrf-schema/entities/Vessel', () => () => {
  const SequelizeMock = require('sequelize-mock');
  const dbMock = new SequelizeMock();
  return dbMock.define('VesselLifeRaft', {});
});
jest.mock('../syrf-schema/entities/VesselLifeRaft', () => () => {
  const SequelizeMock = require('sequelize-mock');
  const dbMock = new SequelizeMock();
  return dbMock.define('VesselLifeRaft', {});
});
jest.mock('../syrf-schema/entities/VesselParticipant', () => () => {
  const SequelizeMock = require('sequelize-mock');
  const dbMock = new SequelizeMock();
  return dbMock.define('VesselParticipant', {});
});
jest.mock('../syrf-schema/entities/VesselParticipantCrew', () => () => {
  const SequelizeMock = require('sequelize-mock');
  const dbMock = new SequelizeMock();
  return dbMock.define('VesselParticipantCrew', {});
});
jest.mock('../syrf-schema/entities/VesselParticipantGroup', () => () => {
  const SequelizeMock = require('sequelize-mock');
  const dbMock = new SequelizeMock();
  return dbMock.define('VesselParticipantGroup', {});
});
jest.mock('../syrf-schema/entities/VesselEditor', () => () => {
  const SequelizeMock = require('sequelize-mock');
  const dbMock = new SequelizeMock();
  return dbMock.define('VesselEditor', {});
});
jest.mock('../syrf-schema/entities/VesselGroupEditor', () => () => {
  const SequelizeMock = require('sequelize-mock');
  const dbMock = new SequelizeMock();
  return dbMock.define('VesselGroupEditor', {});
});
jest.mock('../syrf-schema/entities/CourseSequencedGeometry', () => () => {
  const SequelizeMock = require('sequelize-mock');
  const dbMock = new SequelizeMock();
  return dbMock.define('CourseSequencedGeometry', {});
});
jest.mock(
  '../syrf-schema/entities/CourseUnsequencedTimedGeometry',
  () => () => {
    const SequelizeMock = require('sequelize-mock');
    const dbMock = new SequelizeMock();
    return dbMock.define('CourseUnsequencedTimedGeometry', {});
  },
);
jest.mock(
  '../syrf-schema/entities/CourseUnsequencedUntimedGeometry',
  () => () => {
    const SequelizeMock = require('sequelize-mock');
    const dbMock = new SequelizeMock();
    return dbMock.define('CourseUnsequencedUntimedGeometry', {});
  },
);
jest.mock('../syrf-schema/entities/Developer', () => () => {
  const SequelizeMock = require('sequelize-mock');
  const dbMock = new SequelizeMock();
  return dbMock.define('Developer', {});
});
jest.mock(
  '../syrf-schema/entities/VesselParticipantCrewTrackJson',
  () => () => {
    const SequelizeMock = require('sequelize-mock');
    const dbMock = new SequelizeMock();
    return dbMock.define('VesselParticipantCrewTrackJson', {});
  },
);
jest.mock('../syrf-schema/entities/TrackHistory', () => () => {
  const SequelizeMock = require('sequelize-mock');
  const dbMock = new SequelizeMock();
  return dbMock.define('TrackHistory', {});
});
jest.mock('../syrf-schema/entities/MarkTracker', () => () => {
  const SequelizeMock = require('sequelize-mock');
  const dbMock = new SequelizeMock();
  return dbMock.define('MarkTracker', {});
});
jest.mock('../syrf-schema/entities/ExpeditionSubscription', () => () => {
  const SequelizeMock = require('sequelize-mock');
  const dbMock = new SequelizeMock();
  return dbMock.define('ExpeditionSubscription', {});
});
jest.mock('../syrf-schema/entities/Group', () => () => {
  const SequelizeMock = require('sequelize-mock');
  const dbMock = new SequelizeMock();
  return dbMock.define('Group', {});
});
jest.mock('../syrf-schema/entities/GroupMember', () => () => {
  const SequelizeMock = require('sequelize-mock');
  const dbMock = new SequelizeMock();
  return dbMock.define('GroupMember', {});
});
jest.mock('../syrf-schema/entities/CalendarEditor', () => () => {
  const SequelizeMock = require('sequelize-mock');
  const dbMock = new SequelizeMock();
  return dbMock.define('CalendarEditor', {});
});
jest.mock('../syrf-schema/entities/CalendarGroupEditor', () => () => {
  const SequelizeMock = require('sequelize-mock');
  const dbMock = new SequelizeMock();
  return dbMock.define('CalendarGroupEditor', {});
});
jest.mock('../syrf-schema/entities/UserFollower', () => () => {
  const SequelizeMock = require('sequelize-mock');
  const dbMock = new SequelizeMock();
  return dbMock.define('UserFollower', {});
});
jest.mock('../syrf-schema/entities/UserStream', () => () => {
  const SequelizeMock = require('sequelize-mock');
  const dbMock = new SequelizeMock();
  return dbMock.define('UserStream', {});
});
jest.mock('../syrf-schema/entities/ExternalServiceCredential', () => () => {
  const SequelizeMock = require('sequelize-mock');
  const dbMock = new SequelizeMock();
  return dbMock.define('ExternalServiceCredential', {});
});
jest.mock('../syrf-schema/entities/SubscriptionTier', () => () => {
  const SequelizeMock = require('sequelize-mock');
  const dbMock = new SequelizeMock();
  return dbMock.define('SubscriptionTier', {});
});
jest.mock('../syrf-schema/entities/ParticipationCharge', () => () => {
  const SequelizeMock = require('sequelize-mock');
  const dbMock = new SequelizeMock();
  return dbMock.define('ParticipationCharge', {});
});
jest.mock('../syrf-schema/entities/UserNotification', () => () => {
  const SequelizeMock = require('sequelize-mock');
  const dbMock = new SequelizeMock();
  return dbMock.define('UserNotification', {});
});
jest.mock('../syrf-schema/entities/UserSetting', () => () => {
  const SequelizeMock = require('sequelize-mock');
  const dbMock = new SequelizeMock();
  return dbMock.define('UserSetting', {});
});
jest.mock('../syrf-schema/entities/ParticipantWaiverAgreement', () => () => {
  const SequelizeMock = require('sequelize-mock');
  const dbMock = new SequelizeMock();
  return dbMock.define('ParticipantWaiverAgreement', {});
});
jest.mock('../syrf-schema/entities/ScrapedSuccessfulUrl', () => () => {
  const SequelizeMock = require('sequelize-mock');
  const dbMock = new SequelizeMock();
  return dbMock.define('ScrapedSuccessfulUrl', {});
});
jest.mock('../syrf-schema/entities/ScrapedFailedUrl', () => () => {
  const SequelizeMock = require('sequelize-mock');
  const dbMock = new SequelizeMock();
  return dbMock.define(
    'ScrapedFailedUrl',
    {},
    {
      instanceMethods: {
        create: jest.fn().mockResolvedValue(),
      },
    },
  );
});
