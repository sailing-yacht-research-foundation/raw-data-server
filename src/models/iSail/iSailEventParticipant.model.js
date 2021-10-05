module.exports = (sequelize, Sequelize) => {
  const iSailEventParticipant = sequelize.define(
    'iSailEventParticipant',
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
      class: {
        type: Sequelize.UUID,
        allowNull: true,
      },
      original_class_id: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      class_name: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      sail_no: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      event: {
        type: Sequelize.UUID,
        allowNull: true,
      },
      original_event_id: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      name: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
    },
    {
      tableName: 'iSailEventParticipants',
      timestamps: false,
    },
  );

  return iSailEventParticipant;
};
