const dataAccess = require('../../syrf-schema/dataAccess/v1/vesselParticipantEvent');

exports.bulkCreate = async (data, transaction) => {
  return await dataAccess.bulkCreate(data, transaction);
};
