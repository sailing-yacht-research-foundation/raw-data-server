module.exports = (sequelize, Sequelize) => {
  const kwindooComment = sequelize.define(
    'KwindooComment',
    {
      id: {
        type: Sequelize.UUID,
        allowNull: false,
        primaryKey: true,
      },
      original_id: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      regatta: {
        type: Sequelize.UUID,
        allowNull: false,
      },
      regatta_original_id: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      race: {
        type: Sequelize.UUID,
        allowNull: false,
      },
      race_original_id: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      text: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      event_type: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      lat: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      lon: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      created_at: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      created_at_timestamp: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      boat_name: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
    },
    {
      tableName: 'KwindooComments',
      timestamps: false,
    },
  );
  return kwindooComment;
};
